import * as React from 'react';
import { GlassCard } from './glass-card.js';
import { cn } from '../../lib/utils.js';

export type ActivityStatColor = 'emerald' | 'blue' | 'pink' | 'cyan' | 'amber' | 'purple';

const colorStyles: Record<
  ActivityStatColor,
  {
    pill: string;
    glow: string;
    trendPositive: string;
    trendNegative: string;
  }
> = {
  emerald: {
    pill: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    glow: 'hover:shadow-[0_8px_24px_rgba(16,185,129,0.18)]',
    trendPositive: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
    trendNegative: 'text-rose-500 bg-rose-500/10',
  },
  blue: {
    pill: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    glow: 'hover:shadow-[0_8px_24px_rgba(59,130,246,0.18)]',
    trendPositive: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
    trendNegative: 'text-rose-500 bg-rose-500/10',
  },
  pink: {
    pill: 'bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/30',
    glow: 'hover:shadow-[0_8px_24px_rgba(236,72,153,0.18)]',
    trendPositive: 'text-pink-600 dark:text-pink-400 bg-pink-500/10',
    trendNegative: 'text-rose-500 bg-rose-500/10',
  },
  cyan: {
    pill: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
    glow: 'hover:shadow-[0_8px_24px_rgba(6,182,212,0.18)]',
    trendPositive: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10',
    trendNegative: 'text-rose-500 bg-rose-500/10',
  },
  amber: {
    pill: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    glow: 'hover:shadow-[0_8px_24px_rgba(245,158,11,0.18)]',
    trendPositive: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
    trendNegative: 'text-rose-500 bg-rose-500/10',
  },
  purple: {
    pill: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
    glow: 'hover:shadow-[0_8px_24px_rgba(168,85,247,0.18)]',
    trendPositive: 'text-purple-600 dark:text-purple-400 bg-purple-500/10',
    trendNegative: 'text-rose-500 bg-rose-500/10',
  },
};

export interface ActivityStatTrend {
  value: string | number;
  isPositive?: boolean;
  label?: string;
}

export interface ActivityStatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: ActivityStatColor;
  unit?: string;
  trend?: ActivityStatTrend;
  subtitle?: string;
  interactive?: boolean;
}

export const ActivityStatCard = React.forwardRef<HTMLDivElement, ActivityStatCardProps>(
  (
    {
      label,
      value,
      icon,
      color = 'emerald',
      unit,
      trend,
      subtitle,
      interactive = false,
      className,
      onClick,
      ...props
    },
    ref
  ) => {
    const theme = colorStyles[color] || colorStyles.emerald;

    return (
      <GlassCard
        ref={ref}
        radius="2xl"
        variant={interactive || onClick ? 'interactive' : 'default'}
        onClick={onClick}
        className={cn(
          'p-4 sm:p-5 flex flex-col justify-between transition-all duration-300',
          theme.glow,
          className
        )}
        {...props}
      >
        {/* Header: Icon pill + optional trend badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div
            className={cn(
              'flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl border backdrop-blur-md transition-transform duration-300 group-hover:scale-105',
              theme.pill
            )}
          >
            {icon}
          </div>

          {trend && (
            <div
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold font-mono tracking-tight',
                trend.isPositive !== false ? theme.trendPositive : theme.trendNegative
              )}
            >
              <span>{trend.isPositive !== false ? '↑' : '↓'}</span>
              <span>{trend.value}</span>
              {trend.label && <span className="opacity-70 font-normal">{trend.label}</span>}
            </div>
          )}
        </div>

        {/* Stat Value */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-mono">
              {value}
            </span>
            {unit && (
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">{unit}</span>
            )}
          </div>

          {/* Label / Subtitle */}
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground line-clamp-1">
            {label}
          </p>

          {subtitle && (
            <p className="text-[11px] text-muted-foreground/80 line-clamp-1 pt-0.5">{subtitle}</p>
          )}
        </div>
      </GlassCard>
    );
  }
);
ActivityStatCard.displayName = 'ActivityStatCard';
