'use client';

import * as React from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button, ScrollArea } from '@modern-maps/ui';
import { useMapStore } from '../../stores/useMapStore';
import { SidebarContent } from '../sidebar/SidebarContent';
import { useResponsive } from '../../hooks/useMediaQuery';

export function ResizableSidebar() {
  const { isMobile } = useResponsive();
  const sidebarOpen = useMapStore((state) => state.sidebarOpen);
  const toggleSidebar = useMapStore((state) => state.toggleSidebar);
  const sidebarWidth = useMapStore((state) => state.sidebarWidth);
  const setSidebarWidth = useMapStore((state) => state.setSidebarWidth);

  const [isResizing, setIsResizing] = React.useState(false);
  const sidebarRef = React.useRef<HTMLDivElement | null>(null);

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

  return (
    <>
      {/* Sidebar Shell */}
      <aside
        ref={sidebarRef}
        aria-label="Map Sidebar"
        aria-expanded={sidebarOpen}
        className={`relative z-20 flex h-full flex-col border-r border-border/70 bg-background/95 backdrop-blur-md shadow-xl transition-[width] duration-300 ease-in-out ${
          isResizing ? 'select-none transition-none' : ''
        }`}
        style={{
          width: sidebarOpen ? `${sidebarWidth}px` : '0px',
          minWidth: sidebarOpen ? '280px' : '0px',
          maxWidth: sidebarOpen ? '600px' : '0px',
          overflow: sidebarOpen ? 'visible' : 'hidden',
          visibility: sidebarOpen ? 'visible' : 'hidden',
        }}
      >
        {/* Inner container matching sidebar width */}
        <div className="flex h-full w-full min-w-0 max-w-full flex-col overflow-hidden">
          {/* Header Bar */}
          <div className="flex h-12 items-center justify-between border-b border-border/60 px-3 sm:px-4">
            <span className="font-semibold text-xs tracking-wider uppercase text-muted-foreground truncate mr-2">
              Map Explorer
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleSidebar}
              className="text-muted-foreground hover:text-foreground shrink-0"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          </div>

          {/* Scrollable Content Body */}
          <ScrollArea className="flex-1 px-3 sm:px-4 py-3">
            <SidebarContent />
          </ScrollArea>
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
        <div className="absolute top-16 left-4 z-20 transition-all">
          <Button
            variant="default"
            size="icon"
            onClick={toggleSidebar}
            className="h-9 w-9 rounded-lg shadow-md bg-background/90 text-foreground border border-border/70 hover:bg-background"
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
