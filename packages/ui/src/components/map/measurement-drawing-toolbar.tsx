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

export interface MeasurementDrawingToolbarLabels {
  distance?: string;
  area?: string;
  point?: string;
  line?: string;
  polygon?: string;
  clickToStart?: string;
  complete?: string;
  clear?: string;
  close?: string;
}

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
  labels?: MeasurementDrawingToolbarLabels;
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
      labels,
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

    const distanceLabel = labels?.distance ?? 'Measure distance';
    const areaLabel = labels?.area ?? 'Measure area';
    const pointLabel = labels?.point ?? 'Draw point marker';
    const lineLabel = labels?.line ?? 'Draw line / path';
    const polygonLabel = labels?.polygon ?? 'Draw polygon shape';
    const clickToStartText = labels?.clickToStart ?? 'Click map to start';
    const completeLabel = labels?.complete ?? 'Complete';
    const finishDrawingLabel = labels?.complete ?? 'Finish drawing';
    const clearLabel = labels?.clear ?? 'Clear points';
    const closeLabel = labels?.close ?? 'Close toolbar';
    const exitToolLabel = labels?.close ?? 'Exit tool';

    const handleToggleMode = (mode: MeasurementDrawingMode) => {
      if (activeMode === mode) {
        onModeChange('none');
      } else {
        onModeChange(mode);
      }
    };

    const getToolButtonClass = (isActive: boolean) =>
      cn(
        'flex h-8 w-8 items-center justify-center rounded-lg transition-all active:scale-95',
        isActive
          ? 'bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/30 font-semibold hover:bg-primary/95'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      );

    return (
      <TooltipProvider delayDuration={200}>
        <div
          ref={ref}
          className={cn(
            'absolute z-30 flex items-center gap-1 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-lg border border-black/5 dark:border-white/10 p-1.5 transition-all',
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
                  className={getToolButtonClass(activeMode === 'distance')}
                  aria-label={distanceLabel}
                >
                  <Ruler className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{distanceLabel}</TooltipContent>
            </Tooltip>

            {/* Area Measurement */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => handleToggleMode('area')}
                  className={getToolButtonClass(activeMode === 'area')}
                  aria-label={areaLabel}
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{areaLabel}</TooltipContent>
            </Tooltip>
          </div>

          <div
            className={cn(
              'bg-black/10 dark:bg-white/10',
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
                  className={getToolButtonClass(activeMode === 'point')}
                  aria-label={pointLabel}
                >
                  <MapPin className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{pointLabel}</TooltipContent>
            </Tooltip>

            {/* Line */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => handleToggleMode('line')}
                  className={getToolButtonClass(activeMode === 'line')}
                  aria-label={lineLabel}
                >
                  <Spline className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{lineLabel}</TooltipContent>
            </Tooltip>

            {/* Polygon */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => handleToggleMode('polygon')}
                  className={getToolButtonClass(activeMode === 'polygon')}
                  aria-label={polygonLabel}
                >
                  <Hexagon className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{polygonLabel}</TooltipContent>
            </Tooltip>
          </div>

          {/* Active Status & Measurement Readout */}
          {activeMode !== 'none' && (
            <>
              <div
                className={cn(
                  'bg-black/10 dark:bg-white/10',
                  orientation === 'vertical' ? 'h-[1px] w-full my-0.5' : 'w-[1px] h-5 mx-0.5'
                )}
              />

              <div className="flex items-center gap-1.5 px-1.5">
                {measurementValue !== null && measurementValue !== undefined ? (
                  <Badge variant="secondary" className="font-mono text-xs font-semibold tabular-nums">
                    {measurementValue} {measurementUnit || ''}
                  </Badge>
                ) : pointsCount > 0 ? (
                  <Badge variant="outline" className="font-mono text-[10px] tabular-nums">
                    {pointsCount} pt{pointsCount > 1 ? 's' : ''}
                  </Badge>
                ) : (
                  <span className="text-[11px] text-muted-foreground animate-pulse">
                    {clickToStartText}
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
                      aria-label={finishDrawingLabel}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{completeLabel}</TooltipContent>
                </Tooltip>
              )}

              {onClear && canClear && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={onClear}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive active:scale-95 transition-all"
                      aria-label={clearLabel}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{clearLabel}</TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onModeChange('none')}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-all"
                    aria-label={exitToolLabel}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">{closeLabel}</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </TooltipProvider>
    );
  }
);
MeasurementDrawingToolbar.displayName = 'MeasurementDrawingToolbar';
