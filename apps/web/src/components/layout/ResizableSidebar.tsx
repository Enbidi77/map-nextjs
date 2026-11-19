'use client';

import * as React from 'react';
import { PanelLeftClose, PanelLeftOpen, Compass, LogOut, ShieldCheck } from 'lucide-react';
import { Button, ScrollArea } from '@modern-maps/ui';
import { useMapStore } from '../../stores/useMapStore';
import { SidebarContent } from '../sidebar/SidebarContent';
import { useResponsive } from '../../hooks/useMediaQuery';
import { useAuth } from '../../features/auth/useAuth';

export function ResizableSidebar() {
  const { isMobile } = useResponsive();
  const sidebarOpen = useMapStore((state) => state.sidebarOpen);
  const toggleSidebar = useMapStore((state) => state.toggleSidebar);
  const sidebarWidth = useMapStore((state) => state.sidebarWidth);
  const setSidebarWidth = useMapStore((state) => state.setSidebarWidth);
  const setViewMode = useMapStore((state) => state.setViewMode);
  const { user, profile, signOut } = useAuth();

  const [isResizing, setIsResizing] = React.useState(false);
  const sidebarRef = React.useRef<HTMLDivElement | null>(null);

  // Resize handler on mouse move
  React.useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const newWidth = Math.max(300, Math.min(600, e.clientX));
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

  const userName = profile?.full_name || user?.email?.split('@')[0] || 'Nguyen Bao Duy';

  return (
    <>
      {/* Sidebar Shell with Frosted Liquid Glass Floating Container */}
      <aside
        ref={sidebarRef}
        aria-label="Map Sidebar"
        aria-expanded={sidebarOpen}
        className={`relative z-20 flex h-full flex-col border-r border-white/30 dark:border-white/10 bg-white/75 dark:bg-zinc-900/75 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.5)] transition-[width] duration-300 ease-in-out ${
          isResizing ? 'select-none transition-none' : ''
        }`}
        style={{
          width: sidebarOpen ? `${sidebarWidth}px` : '0px',
          minWidth: sidebarOpen ? '300px' : '0px',
          maxWidth: sidebarOpen ? '600px' : '0px',
          overflow: sidebarOpen ? 'visible' : 'hidden',
          visibility: sidebarOpen ? 'visible' : 'hidden',
        }}
      >
        {/* Inner container matching sidebar width */}
        <div className="flex h-full w-full min-w-0 max-w-full flex-col overflow-hidden">
          {/* Header Bar with Multi-color Branding Logo */}
          <div className="flex h-16 items-center justify-between border-b border-white/20 dark:border-white/10 px-4 shrink-0">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setViewMode('dashboard')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setViewMode('dashboard');
              }}
              className="flex items-center gap-2.5 cursor-pointer select-none group"
            >
              {/* Multi-color Gradient Icon */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-primary/20 transition-transform duration-300 group-hover:scale-105">
                <Compass className="h-5 w-5" />
              </div>

              {/* Branding Text */}
              <div className="flex flex-col leading-tight min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm sm:text-base tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-300 dark:to-purple-300">
                    Modern Maps
                  </span>
                  <span className="flex h-4 items-center rounded-full bg-primary/10 px-1.5 font-mono text-[9px] font-bold text-primary">
                    v5.1
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground font-medium tracking-tight">
                  Explore • Navigate • Connect
                </span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleSidebar}
              className="rounded-full text-muted-foreground hover:text-foreground shrink-0"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          </div>

          {/* Scrollable Content Body */}
          <ScrollArea className="flex-1 px-3 sm:px-4 py-3 min-h-0">
            <SidebarContent />
          </ScrollArea>

          {/* Bottom User Profile Pill with Avatar and 'Online' Green Status Indicator */}
          <div className="p-3 border-t border-white/20 dark:border-white/10 shrink-0">
            <div className="relative flex items-center justify-between gap-2.5 rounded-2xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-zinc-800/50 p-2.5 backdrop-blur-xl shadow-sm transition-all hover:bg-white/80 dark:hover:bg-zinc-800/80">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Avatar with pulsing green online dot */}
                <div className="relative h-9 w-9 shrink-0 rounded-full border border-white/50 dark:border-white/20 overflow-hidden shadow-sm">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={userName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-xs font-bold uppercase">
                      {userName[0]}
                    </div>
                  )}
                  {/* Online Green Indicator Dot */}
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background animate-pulse" />
                </div>

                {/* User Details */}
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-xs text-foreground truncate">
                      {userName}
                    </span>
                    <ShieldCheck className="h-3 w-3 text-blue-500 shrink-0" />
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      Online
                    </span>
                    <span>• Pro Explorer</span>
                  </div>
                </div>
              </div>

              {/* Logout / User Action */}
              {user ? (
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="flex h-7 w-7 items-center justify-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              ) : (
                <div className="flex h-6 items-center rounded-lg bg-primary/10 px-2 text-[10px] font-semibold text-primary shrink-0">
                  Active
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Draggable Resize Handle */}
        {sidebarOpen && (
          <div
            onMouseDown={() => setIsResizing(true)}
            role="separator"
            aria-orientation="vertical"
            className="group absolute top-0 right-0 z-30 flex h-full w-2 translate-x-1 cursor-col-resize items-center justify-center hover:bg-primary/20 transition-colors"
            title="Drag to resize sidebar"
          >
            <div className="h-8 w-1 rounded-full bg-border group-hover:bg-primary transition-colors" />
          </div>
        )}
      </aside>

      {/* Floating Expand Button when collapsed */}
      {!sidebarOpen && (
        <div className="fixed top-20 left-4 z-30 transition-all">
          <Button
            variant="default"
            size="icon"
            onClick={toggleSidebar}
            className="h-9 w-9 rounded-full shadow-lg bg-white/80 dark:bg-zinc-900/80 text-foreground border border-white/40 dark:border-white/10 hover:bg-white dark:hover:bg-zinc-900 backdrop-blur-xl"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="h-4 w-4 text-primary" />
          </Button>
        </div>
      )}
    </>
  );
}
