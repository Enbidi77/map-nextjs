import * as React from 'react';
import { cn } from '../../lib/utils.js';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../tooltip.js';

export interface NorthCompassProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  bearing?: number;
  pitch?: number;
  onResetNorth?: () => void;
  tooltipSide?: 'top' | 'right' | 'bottom' | 'left';
  label?: string;
}

export const NorthCompass = React.forwardRef<HTMLButtonElement, NorthCompassProps>(
  (
    {
      className,
      bearing = 0,
      pitch = 0,
      onResetNorth,
      onClick,
      tooltipSide = 'right',
      label = 'Reset bearing to North',
      ...props
    },
    ref
  ) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onResetNorth?.();
      onClick?.(e);
    };

    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              ref={ref}
              type="button"
              aria-label={label}
              onClick={handleClick}
              className={cn(
                'group relative flex h-9 w-9 select-none items-center justify-center rounded-full bg-black text-white shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                className
              )}
              {...props}
            >
              {/* Rotating inner container for compass needle/tick and label */}
              <div
                className="relative flex h-full w-full items-center justify-center transition-transform duration-200"
                style={{ transform: `rotate(${-bearing}deg)` }}
                data-testid="north-compass-needle"
              >
                {/* Red/white directional tick at top */}
                <div className="absolute top-1 flex items-center justify-center">
                  <svg
                    viewBox="0 0 8 8"
                    className="h-2 w-2"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <polygon points="4,0 7,6 4,4" fill="#ef4444" />
                    <polygon points="4,0 1,6 4,4" fill="#ffffff" />
                  </svg>
                </div>

                {/* White 'N' label */}
                <span className="font-bold text-xs tracking-tighter text-white select-none pt-0.5">
                  N
                </span>
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side={tooltipSide} className="text-xs">
            {bearing !== 0 || pitch !== 0
              ? `${label} (${Math.round(bearing)}°)`
              : label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);
NorthCompass.displayName = 'NorthCompass';
