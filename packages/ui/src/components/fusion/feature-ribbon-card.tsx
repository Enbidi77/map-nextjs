import * as React from 'react';
import { GlassCard, type GlassCardProps } from './glass-card.js';
import { cn } from '../../lib/utils.js';

export interface FeatureRibbonCardProps extends Omit<GlassCardProps, 'title' | 'variant'> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  active?: boolean;
  variant?: 'default' | 'compact' | 'featured';
}

export const FeatureRibbonCard = React.forwardRef<HTMLDivElement, FeatureRibbonCardProps>(
  (
    {
      icon,
      title,
      description,
      badge,
      action,
      active = false,
      variant = 'default',
      children,
      className,
      onClick,
      ...props
    },
    ref
  ) => {
    const isInteractive = Boolean(onClick);

    return (
      <GlassCard
        ref={ref}
        radius="3xl"
        variant={active ? 'elevated' : isInteractive ? 'interactive' : 'default'}
        onClick={onClick}
        className={cn(
          'flex flex-col justify-between transition-all duration-300',
          variant === 'compact' ? 'p-3 sm:p-4 min-w-[200px]' : 'p-4 sm:p-5 min-w-[260px]',
          active &&
            'ring-2 ring-primary/50 shadow-[0_12px_36px_rgba(59,130,246,0.18)] dark:shadow-[0_12px_36px_rgba(59,130,246,0.25)]',
          className
        )}
        {...props}
      >
        {/* Header: Icon + Titles + Badge/Action */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {icon && (
              <div
                className={cn(
                  'flex items-center justify-center rounded-2xl border backdrop-blur-md transition-all duration-300',
                  active
                    ? 'bg-primary/20 text-primary border-primary/30 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
                    : 'bg-white/40 dark:bg-white/10 text-foreground border-white/30 dark:border-white/15',
                  variant === 'compact' ? 'h-9 w-9' : 'h-10 w-10 sm:h-11 sm:w-11'
                )}
              >
                {icon}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm sm:text-base font-semibold text-foreground truncate tracking-tight">
                  {title}
                </h4>
                {badge && (
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary border border-primary/20">
                    {badge}
                  </span>
                )}
              </div>
              {description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{description}</p>
              )}
            </div>
          </div>

          {action && <div className="flex-shrink-0">{action}</div>}
        </div>

        {/* Interactive Elements / Custom Content Slot */}
        {children && <div className="mt-3 pt-2.5 border-t border-white/20 dark:border-white/10">{children}</div>}
      </GlassCard>
    );
  }
);
FeatureRibbonCard.displayName = 'FeatureRibbonCard';
