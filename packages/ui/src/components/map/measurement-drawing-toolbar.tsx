import * as React from 'react';
import {
  Ruler,
  Maximize2,
  MapPin,
  Spline,
  Hexagon,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils.js';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../tooltip.js';
import { Badge } from '../badge.js';

export type MeasurementDrawingMode =
  | 'none'
  | 'distance'
  | 'area'
  | 'point'
  | 'line'
  | 'polygon';

export interface MeasurementDrawingToolbarProps
  extends React.HTMLAttributes<HTMLDivElement> {
  activeMode: MeasurementDrawingMode;
  onModeChange: (mode: MeasurementDrawingMode) => void;
  onClear?: () => void;
  onFinish?: () => void;
  canFinish?: boolean;
  canClear?: boolean;
  measurementValue?: string | number | null;
  measurementUnit?: string;
  pointsCount?: number;
  orientation?: 'horizontal' | 'vertical';
  position?: 'top-left' | 'top-right' | 'top-center' | 'bottom-center';
}

export const MeasurementDrawingToolbar = React.forwardRef<
  HTMLDivElement,
  MeasurementDrawingToolbarProps
>(
  (
    {
      className,
      activeMode,
      onModeChange,
      onClear,
      onFinish,
      canFinish = false,
      canClear = false,
      measurementValue,
      measurementUnit,
      pointsCount = 0,
      orientation = 'horizontal',
      position = 'top-center',
      ...props
    },
    ref
  ) => {
    const positionClasses: Record<string, string> = {
      'top-left': 'top-4 left-4',
      'top-right': 'top-4 right-4',
      'top-center': 'top-4 left-1/2 -translate-x-1/2',
      'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
    };

    const handleToggleMode = (mode: MeasurementDrawingMode) => {
      if (activeMode === mode) {
        onModeChange('none');
      } else {
        onModeChange(mode);
      }
    };

    return (
      <TooltipProvider delayDuration={200}>
        <div
          ref={ref}
          className={cn(
            'absolute z-30 flex items-center gap-1 rounded-xl border border-border/70 bg-background/95 p-1.5 shadow-xl backdrop-blur-md transition-all',
            orientation === 'vertical' ? 'flex-col' : 'flex-row',
            position ? positionClasses[position] : '',
            className
          )}
          {...props}
        >
          {/* Measurement Group */}
          <div className="flex items-center gap-1">
            {/* Distance Measurement */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => handleToggleMode('distance')}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg text-foreground transition-all hover:bg-accent hover:text-accent-foreground active:scale-95',
                    activeMode === 'distance' &&
                      'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-sm'
                  )}
                  aria-label="Measure distance"
                >
                  <Ruler className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Measure path distance</TooltipContent>
            </Tooltip>

            {/* Area Measurement */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => handleToggleMode('area')}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg text-foreground transition-all hover:bg-accent hover:text-accent-foreground active:scale-95',
                    activeMode === 'area' &&
                      'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-sm'
                  )}
                  aria-label="Measure area"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Measure polygon area</TooltipContent>
            </Tooltip>
          </div>

          <div
            className={cn(
              'bg-border/60',
              orientation === 'vertical' ? 'h-[1px] w-full my-0.5' : 'w-[1px] h-5 mx-0.5'
            )}
          />

          {/* Drawing Group */}
          <div className="flex items-center gap-1">
            {/* Point / Marker */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => handleToggleMode('point')}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg text-foreground transition-all hover:bg-accent hover:text-accent-foreground active:scale-95',
                    activeMode === 'point' &&
                      'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-sm'
                  )}
                  aria-label="Draw marker"
                >
                  <MapPin className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Draw point marker</TooltipContent>
            </Tooltip>

            {/* Line */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => handleToggleMode('line')}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg text-foreground transition-all hover:bg-accent hover:text-accent-foreground active:scale-95',
                    activeMode === 'line' &&
                      'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-sm'
                  )}
                  aria-label="Draw line"
                >
                  <Spline className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Draw line / path</TooltipContent>
            </Tooltip>

            {/* Polygon */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => handleToggleMode('polygon')}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg text-foreground transition-all hover:bg-accent hover:text-accent-foreground active:scale-95',
                    activeMode === 'polygon' &&
                      'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-sm'
                  )}
                  aria-label="Draw polygon"
                >
                  <Hexagon className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Draw polygon shape</TooltipContent>
            </Tooltip>
          </div>

          {/* Active Status & Measurement Readout */}
          {activeMode !== 'none' && (
            <>
              <div
                className={cn(
                  'bg-border/60',
                  orientation === 'vertical' ? 'h-[1px] w-full my-0.5' : 'w-[1px] h-5 mx-0.5'
                )}
              />

              <div className="flex items-center gap-1.5 px-1.5">
                {measurementValue !== null && measurementValue !== undefined ? (
                  <Badge variant="secondary" className="font-mono text-xs font-semibold">
                    {measurementValue} {measurementUnit || ''}
                  </Badge>
                ) : pointsCount > 0 ? (
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {pointsCount} pt{pointsCount > 1 ? 's' : ''}
                  </Badge>
                ) : (
                  <span className="text-[11px] text-muted-foreground animate-pulse">
                    Click map to start
                  </span>
                )}
              </div>
            </>
          )}

          {/* Actions: Finish / Clear / Exit */}
          {activeMode !== 'none' && (
            <div className="flex items-center gap-1">
              {onFinish && canFinish && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={onFinish}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition-all"
                      aria-label="Finish drawing"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Complete</TooltipContent>
                </Tooltip>
              )}

              {onClear && canClear && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={onClear}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive active:scale-95 transition-all"
                      aria-label="Clear points"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Clear points</TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onModeChange('none')}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-all"
                    aria-label="Exit tool"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Close toolbar</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </TooltipProvider>
    );
  }
);
MeasurementDrawingToolbar.displayName = 'MeasurementDrawingToolbar';
