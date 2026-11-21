'use client';

import * as React from 'react';
import { Compass, PanelLeftClose, Search, Navigation, Bookmark } from 'lucide-react';
import { Button, ScrollArea, SearchBar } from '@modern-maps/ui';
import { useMapStore, type SidebarView } from '../../stores/useMapStore';
import { SidebarContent } from '../sidebar/SidebarContent';
import { useResponsive } from '../../hooks/useMediaQuery';
import { useTranslation } from '../../features/i18n';

export function ResizableSidebar() {
  const { isMobile } = useResponsive();
  const { t } = useTranslation();
  const sidebarOpen = useMapStore((state) => state.sidebarOpen);
  const toggleSidebar = useMapStore((state) => state.toggleSidebar);
  const setSidebarOpen = useMapStore((state) => state.setSidebarOpen);
  const sidebarWidth = useMapStore((state) => state.sidebarWidth);
  const setSidebarWidth = useMapStore((state) => state.setSidebarWidth);
  const sidebarView = useMapStore((state) => state.sidebarView);
  const setSidebarView = useMapStore((state) => state.setSidebarView);
  const searchQuery = useMapStore((state) => state.searchQuery);
  const setSearchQuery = useMapStore((state) => state.setSearchQuery);
  const savedCount = useMapStore((state) => state.savedPlaces.length);

  const searchInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isResizing, setIsResizing] = React.useState(false);
  const sidebarRef = React.useRef<HTMLDivElement | null>(null);

  // Global keyboard shortcut for ⌘K / Ctrl+K search focus
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSidebarOpen(true);
        setSidebarView('search');
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSidebarOpen, setSidebarView]);

  // Resize handler on mouse move
  React.useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const newWidth = Math.max(280, Math.min(600, e.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, setSidebarWidth]);

  // Don't render desktop sidebar on mobile (mobile uses bottom sheet)
  if (isMobile) {
    return null;
  }

  const TABS: Array<{ id: SidebarView; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'search', label: t('sidebar.explore'), icon: <Search className="h-3.5 w-3.5" /> },
    { id: 'directions', label: t('sidebar.directions'), icon: <Navigation className="h-3.5 w-3.5" /> },
    { id: 'saved', label: t('sidebar.saved'), icon: <Bookmark className="h-3.5 w-3.5" />, badge: savedCount },
  ];

  return (
    <>
      {/* Modern Floating Explorer Panel */}
      <aside
        ref={sidebarRef}
        aria-label="Map Sidebar"
        aria-expanded={sidebarOpen}
        className={`absolute top-3 bottom-3 left-3 sm:top-4 sm:bottom-4 sm:left-4 z-20 flex h-[calc(100vh-1.5rem)] sm:h-[calc(100vh-2rem)] flex-col rounded-2xl border border-black/5 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl overflow-hidden transition-[width] duration-300 ease-in-out ${
          isResizing ? 'select-none transition-none' : ''
        }`}
        style={{
          width: sidebarOpen ? `${sidebarWidth}px` : '0px',
          minWidth: sidebarOpen ? '280px' : '0px',
          maxWidth: sidebarOpen ? '600px' : '0px',
          overflow: sidebarOpen ? 'hidden' : 'hidden',
          visibility: sidebarOpen ? 'visible' : 'hidden',
        }}
      >
        {/* Sticky Top Header inside Floating Panel */}
        <div className="flex flex-col gap-2 border-b border-border/60 bg-white/90 dark:bg-slate-900/90 p-2.5 sm:p-3 shrink-0 backdrop-blur-md">
          {/* Row 1: Brand Anchor + Embedded Search Bar + Sleek Collapse Button */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                setSidebarView('search');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setSidebarView('search');
                }
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shrink-0 cursor-pointer select-none transition-transform hover:scale-105 active:scale-95"
              title={t('nav.brand')}
            >
              <Compass className="h-4 w-4" />
            </div>

            <div className="flex-1 min-w-0">
              <SearchBar
                ref={searchInputRef}
                value={searchQuery}
                onChange={(val) => {
                  setSearchQuery(val);
                  if (val && sidebarView !== 'search') {
                    setSidebarView('search');
                  }
                }}
                onSearch={(val) => {
                  setSearchQuery(val);
                  setSidebarView('search');
                }}
                showDirectionsButton={false}
                placeholder={t('nav.searchPlaceholder')}
                className="h-8 py-0 border-0 bg-transparent shadow-none focus-within:ring-0 focus-visible:ring-0"
              />
            </div>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleSidebar}
              className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 rounded-lg hover:bg-muted/60"
              aria-label={t('sidebar.collapse')}
              title={t('sidebar.collapse')}
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          </div>

          {/* Row 2: Segmented Tab Switcher */}
          <div className="flex rounded-lg border border-border/60 bg-muted/40 p-1 w-full min-w-0">
            {TABS.map((tab) => {
              const isActive =
                sidebarView === tab.id || (tab.id === 'search' && sidebarView === 'place');
              return (
                <button
                  key={tab.id}
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setSidebarView(tab.id)}
                  className={`flex flex-1 min-w-0 items-center justify-center gap-1 sm:gap-1.5 rounded-md py-1.5 px-1 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-background text-foreground shadow-sm font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="shrink-0">{tab.icon}</span>
                  <span className="truncate">{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="flex h-3.5 min-w-3.5 shrink-0 items-center justify-center rounded-full bg-primary/20 px-1 font-mono text-[9px] font-bold text-primary">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Content Body with hideTabs={true} to avoid duplicate tabs */}
        <ScrollArea className="flex-1 px-3 sm:px-4 py-3">
          <SidebarContent hideTabs={true} />
        </ScrollArea>

        {/* Draggable Resize Handle */}
        {sidebarOpen && (
          <div
            onMouseDown={() => setIsResizing(true)}
            role="separator"
            aria-orientation="vertical"
            className="group absolute top-0 right-0 z-30 flex h-full w-2 translate-x-1 cursor-col-resize items-center justify-center hover:bg-primary/20 transition-colors"
            title={t('sidebar.resize')}
          >
            <div className="h-8 w-1 rounded-full bg-border group-hover:bg-primary transition-colors" />
          </div>
        )}
      </aside>
    </>
  );
}
