import * as React from 'react';
import { ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '../../lib/utils.js';
import { ScrollArea } from '../scroll-area.js';
import { Button } from '../button.js';

export interface CollapsibleSidebarProps extends React.HTMLAttributes<HTMLElement> {
  isOpen?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  showToggleTrigger?: boolean;
  triggerPosition?: 'inside' | 'floating' | 'both';
  position?: 'left' | 'right';
  resizable?: boolean;
}

export const CollapsibleSidebar = React.forwardRef<
  HTMLElement,
  CollapsibleSidebarProps
>(
  (
    {
      className,
      children,
      isOpen: controlledOpen,
      defaultOpen = true,
      onOpenChange,
      width = 380,
      minWidth = 280,
      maxWidth = 600,
      header,
      footer,
      showToggleTrigger = true,
      triggerPosition = 'inside',
      position = 'left',
      resizable: _resizable = false,
      ...props
    },
    ref
  ) => {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
    const isOpen = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;

    const toggleOpen = React.useCallback(() => {
      const next = !isOpen;
      setUncontrolledOpen(next);
      onOpenChange?.(next);
    }, [isOpen, onOpenChange]);

    const formattedWidth = typeof width === 'number' ? `${width}px` : width;

    return (
      <>
        {/* Sidebar Container */}
        <aside
          ref={ref}
          role="complementary"
          aria-expanded={isOpen}
          className={cn(
            'relative z-20 flex h-full flex-col bg-background/95 backdrop-blur-md shadow-xl transition-all duration-300 ease-in-out',
            position === 'left' ? 'border-r border-border/70' : 'border-l border-border/70',
            isOpen ? 'opacity-100' : 'pointer-events-none opacity-0 md:pointer-events-auto md:opacity-100',
            className
          )}
          style={{
            width: isOpen ? formattedWidth : '0px',
            minWidth: isOpen ? minWidth : 0,
            maxWidth: isOpen ? maxWidth : 0,
            overflow: isOpen ? 'visible' : 'hidden',
          }}
          {...props}
        >
          {/* Inner content wrapper with fixed width so contents don't squish during transition */}
          <div
            className="flex h-full flex-col overflow-hidden"
            style={{ width: formattedWidth }}
          >
            {/* Header */}
            {header && (
              <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                <div className="flex-1 overflow-hidden">{header}</div>
                {showToggleTrigger && (triggerPosition === 'inside' || triggerPosition === 'both') && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="ml-2 text-muted-foreground hover:text-foreground"
                    onClick={toggleOpen}
                    aria-label="Collapse sidebar"
                  >
                    {position === 'left' ? (
                      <PanelLeftClose className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* Scrollable Body */}
            <ScrollArea className="flex-1 px-4 py-2">
              <div className="space-y-4 pb-4">{children}</div>
            </ScrollArea>

            {/* Footer */}
            {footer && (
              <div className="border-t border-border/60 px-4 py-3 bg-muted/20">
                {footer}
              </div>
            )}
          </div>
        </aside>

        {/* Floating toggle trigger button when collapsed or floating */}
        {showToggleTrigger && (triggerPosition === 'floating' || triggerPosition === 'both' || !isOpen) && (
          <div
            className={cn(
              'absolute z-20 transition-all duration-300 top-4',
              position === 'left'
                ? isOpen
                  ? 'left-[388px]'
                  : 'left-4'
                : isOpen
                ? 'right-[388px]'
                : 'right-4'
            )}
            style={
              isOpen && typeof width === 'number'
                ? { [position]: `${width + 8}px` }
                : undefined
            }
          >
            <Button
              variant="map"
              size="icon"
              className="rounded-lg shadow-md"
              onClick={toggleOpen}
              aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {position === 'left' ? (
                isOpen ? <ChevronLeft className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />
              ) : isOpen ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <PanelLeftOpen className="h-4 w-4 rotate-180" />
              )}
            </Button>
          </div>
        )}
      </>
    );
  }
);
CollapsibleSidebar.displayName = 'CollapsibleSidebar';
