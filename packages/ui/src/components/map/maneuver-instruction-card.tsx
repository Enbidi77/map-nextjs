import * as React from 'react';
import {
  ArrowUp,
  ArrowUpLeft,
  ArrowUpRight,
  CornerUpLeft,
  CornerUpRight,
  RotateCcw,
  RotateCw,
  GitMerge,
  GitFork,
  Flag,
  Navigation,
} from 'lucide-react';
import { cn } from '../../lib/utils.js';
import { Badge } from '../badge.js';

export interface ManeuverInstructionCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  type?: string;
  modifier?: string;
  instruction: string;
  streetName?: string;
  distance?: number | string;
  duration?: number | string;
  stepNumber?: number;
  totalSteps?: number;
  isCurrent?: boolean;
  compact?: boolean;
}

/**
 * Returns the appropriate Lucide icon for a route maneuver type and modifier.
 */
export function getManeuverIcon(type?: string, modifier?: string) {
  const normType = (type || '').toLowerCase();
  const normMod = (modifier || '').toLowerCase().replace(/[\s_-]/g, '');

  if (normType.includes('arrive') || normType.includes('destination')) {
    return <Flag className="h-5 w-5 text-emerald-500" />;
  }
  if (normType.includes('depart') || normType.includes('start')) {
    return <Navigation className="h-5 w-5 text-primary" />;
  }
  if (normType.includes('roundabout') || normMod.includes('roundabout')) {
    return <RotateCw className="h-5 w-5 text-primary" />;
  }
  if (normType.includes('merge') || normMod.includes('merge')) {
    return <GitMerge className="h-5 w-5 text-primary" />;
  }
  if (normType.includes('fork')) {
    return <GitFork className="h-5 w-5 text-primary" />;
  }

  // Modifiers
  if (normMod.includes('uturn')) {
    return <RotateCcw className="h-5 w-5 text-amber-500" />;
  }
  if (normMod.includes('slightleft')) {
    return <ArrowUpLeft className="h-5 w-5 text-primary" />;
  }
  if (normMod.includes('slightright')) {
    return <ArrowUpRight className="h-5 w-5 text-primary" />;
  }
  if (normMod.includes('sharpleft') || normMod === 'left') {
    return <CornerUpLeft className="h-5 w-5 text-primary" />;
  }
  if (normMod.includes('sharpright') || normMod === 'right') {
    return <CornerUpRight className="h-5 w-5 text-primary" />;
  }
  if (normMod.includes('straight') || normMod.includes('continue')) {
    return <ArrowUp className="h-5 w-5 text-primary" />;
  }

  return <ArrowUp className="h-5 w-5 text-primary" />;
}

export const ManeuverInstructionCard = React.forwardRef<
  HTMLDivElement,
  ManeuverInstructionCardProps
>(
  (
    {
      className,
      type,
      modifier,
      instruction,
      streetName,
      distance,
      duration,
      stepNumber,
      totalSteps,
      isCurrent = false,
      compact = false,
      ...props
    },
    ref
  ) => {
    const formattedDistance =
      typeof distance === 'number'
        ? distance < 1000
          ? `${Math.round(distance)} m`
          : `${(distance / 1000).toFixed(1)} km`
        : distance;

    const formattedDuration =
      typeof duration === 'number'
        ? duration < 60
          ? `${Math.round(duration)} sec`
          : `${Math.round(duration / 60)} min`
        : duration;

    if (compact) {
      return (
        <div
          ref={ref}
          className={cn(
            'flex items-center gap-2 rounded-lg border p-2 transition-all text-xs w-full min-w-0',
            isCurrent
              ? 'border-primary/50 bg-primary/10 shadow-sm'
              : 'border-border/50 hover:bg-muted/40 text-muted-foreground hover:text-foreground',
            className
          )}
          {...props}
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted/60">
            {getManeuverIcon(type, modifier)}
          </div>
          <div className="flex-1 min-w-0">
            <span
              className={cn('block truncate font-medium', isCurrent && 'text-foreground font-semibold')}
              title={instruction}
            >
              {instruction}
            </span>
          </div>
          {formattedDistance && (
            <span className="font-mono text-[10px] font-medium text-muted-foreground shrink-0 pl-1">
              {formattedDistance}
            </span>
          )}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex flex-col gap-2 rounded-xl border p-4 shadow-sm transition-all',
          isCurrent
            ? 'border-primary/60 bg-primary/5 ring-1 ring-primary/20 shadow-md'
            : 'border-border/70 bg-card text-card-foreground hover:border-border',
          className
        )}
        {...props}
      >
        <div className="flex items-start gap-3.5">
          {/* Maneuver Icon Box */}
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-inner',
              isCurrent
                ? 'bg-primary/15 text-primary border border-primary/30'
                : 'bg-muted/70 text-foreground border border-border/50'
            )}
          >
            {getManeuverIcon(type, modifier)}
          </div>

          {/* Details */}
          <div className="flex flex-1 flex-col">
            <div className="flex items-center justify-between gap-2">
              {stepNumber !== undefined && (
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Step {stepNumber}
                  {totalSteps !== undefined ? ` of ${totalSteps}` : ''}
                </span>
              )}
              {isCurrent && (
                <Badge variant="default" className="text-[10px] h-4 px-1.5 py-0 font-medium">
                  Current
                </Badge>
              )}
            </div>

            <p className="mt-0.5 text-sm font-semibold leading-snug text-foreground">
              {instruction}
            </p>

            {streetName && (
              <p className="text-xs text-muted-foreground mt-0.5">{streetName}</p>
            )}

            {/* Distance & Duration Badge */}
            {(formattedDistance || formattedDuration) && (
              <div className="mt-2 flex items-center gap-2 font-mono text-xs text-muted-foreground">
                {formattedDistance && (
                  <span className="font-semibold text-foreground">
                    {formattedDistance}
                  </span>
                )}
                {formattedDistance && formattedDuration && <span>•</span>}
                {formattedDuration && <span>{formattedDuration}</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);
ManeuverInstructionCard.displayName = 'ManeuverInstructionCard';
