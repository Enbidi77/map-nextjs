import * as React from 'react';
import {
  Plus,
  Minus,
  Box,
  Locate,
  Maximize,
  Minimize,
  Layers,
  Loader2,
} from 'lucide-react';
import { cn } from '../../lib/utils.js';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../tooltip.js';

export interface MapControlButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  label: string;
  shortcut?: string;
  tooltipSide?: 'top' | 'right' | 'bottom' | 'left';
  active?: boolean;
  loading?: boolean;
}

export const MapControlButton = React.forwardRef<
  HTMLButtonElement,
  MapControlButtonProps
>(
  (
    {
      className,
      icon,
      label,
      shortcut,
      tooltipSide = 'left',
      active = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              ref={ref}
              type="button"
              aria-label={label}
              disabled={disabled || loading}
              className={cn(
                'group relative flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition-all duration-150',
                'hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                'disabled:cursor-not-allowed disabled:opacity-40 active:scale-95',
                active && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
                className
              )}
              {...props}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground group-hover:text-foreground" />
              ) : (
                icon || children
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side={tooltipSide} className="flex items-center gap-1.5 text-xs">
            <span>{label}</span>
            {shortcut && (
              <kbd className="rounded bg-primary-foreground/20 px-1 py-0.5 text-[10px] font-mono leading-none">
                {shortcut}
              </kbd>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);
MapControlButton.displayName = 'MapControlButton';

export interface FloatingMapControlsLabels {
  zoomIn?: string;
  zoomOut?: string;
  orientNorth?: string;
  resetBearing?: (bearing: number) => string;
  switchTo2D?: string;
  switchTo3D?: string;
  findLocation?: string;
  layers?: string;
  enterFullscreen?: string;
  exitFullscreen?: string;
}

export interface FloatingMapControlsProps extends React.HTMLAttributes<HTMLDivElement> {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  // Zoom
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  zoomDisabled?: boolean;
  // Compass / Bearing
  bearing?: number;
  onResetBearing?: () => void;
  showCompass?: boolean;
  // 3D / Pitch
  is3D?: boolean;
  onToggle3D?: () => void;
  show3DToggle?: boolean;
  // Geolocation
  isLocating?: boolean;
  isLocationActive?: boolean;
  onGeolocate?: () => void;
  showGeolocate?: boolean;
  // Fullscreen
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  showFullscreen?: boolean;
  // Layer Toggle
  isLayerMenuOpen?: boolean;
  onToggleLayerMenu?: () => void;
  showLayerToggle?: boolean;
  // Orientation
  orientation?: 'vertical' | 'horizontal';
  // Localized Labels
  labels?: FloatingMapControlsLabels;
}

const positionClasses: Record<string, string> = {
  'top-left': 'top-4 left-4',
  'top-right': 'top-4 right-4',
  'bottom-left': 'bottom-6 left-4',
  'bottom-right': 'bottom-6 right-4',
};

export const FloatingMapControls = React.forwardRef<
  HTMLDivElement,
  FloatingMapControlsProps
>(
  (
    {
      className,
      position = 'top-right',
      orientation = 'vertical',
      onZoomIn,
      onZoomOut,
      zoomDisabled,
      bearing = 0,
      onResetBearing,
      showCompass = true,
      is3D = false,
      onToggle3D,
      show3DToggle = true,
      isLocating = false,
      isLocationActive = false,
      onGeolocate,
      showGeolocate = true,
      isFullscreen = false,
      onToggleFullscreen,
      showFullscreen = true,
      isLayerMenuOpen = false,
      onToggleLayerMenu,
      showLayerToggle = true,
      labels,
      children,
      ...props
    },
    ref
  ) => {
    const tooltipSide = position.includes('right') ? 'left' : 'right';

    const zoomInLabel = labels?.zoomIn ?? 'Zoom in';
    const zoomOutLabel = labels?.zoomOut ?? 'Zoom out';
    const orientNorthLabel = labels?.orientNorth ?? 'Orient North';
    const resetBearingLabel =
      labels?.resetBearing?.(Math.round(bearing)) ?? `Reset Bearing (${Math.round(bearing)}°)`;
    const switchTo2DLabel = labels?.switchTo2D ?? 'Switch to 2D view';
    const switchTo3DLabel = labels?.switchTo3D ?? 'Switch to 3D perspective';
    const findLocationLabel = labels?.findLocation ?? 'Find my location';
    const layersLabel = labels?.layers ?? 'Map layers & styles';
    const enterFullscreenLabel = labels?.enterFullscreen ?? 'Enter fullscreen';
    const exitFullscreenLabel = labels?.exitFullscreen ?? 'Exit fullscreen';

    const hasZoom = Boolean(onZoomIn || onZoomOut);
    const hasCamera = Boolean(
      (showCompass && onResetBearing) ||
      (show3DToggle && onToggle3D) ||
      (showGeolocate && onGeolocate)
    );
    const hasDisplay = Boolean(
      (showLayerToggle && onToggleLayerMenu) ||
      (showFullscreen && onToggleFullscreen)
    );

    const dividerClass =
      orientation === 'vertical'
        ? 'h-[1px] w-full my-0.5 bg-black/10 dark:bg-white/10'
        : 'w-[1px] h-full mx-0.5 bg-black/10 dark:bg-white/10';

    return (
      <div
        ref={ref}
        className={cn(
          'absolute z-30 flex gap-1 p-1 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-lg border border-black/5 dark:border-white/10 transition-all duration-200',
          orientation === 'vertical' ? 'flex-col items-center' : 'flex-row items-center',
          position ? positionClasses[position] : '',
          className
        )}
        {...props}
      >
        {/* 1. Zoom Controls */}
        {onZoomIn && (
          <MapControlButton
            label={zoomInLabel}
            shortcut="+"
            tooltipSide={tooltipSide}
            disabled={zoomDisabled}
            onClick={onZoomIn}
            icon={<Plus className="h-4 w-4" />}
          />
        )}
        {onZoomOut && (
          <MapControlButton
            label={zoomOutLabel}
            shortcut="-"
            tooltipSide={tooltipSide}
            disabled={zoomDisabled}
            onClick={onZoomOut}
            icon={<Minus className="h-4 w-4" />}
          />
        )}

        {/* Divider between Zoom and Camera */}
        {hasZoom && (hasCamera || hasDisplay) && (
          <div className={dividerClass} />
        )}

        {/* 2. Camera Controls: Compass with dynamic red North needle tip */}
        {showCompass && onResetBearing && (
          <MapControlButton
            label={bearing === 0 ? orientNorthLabel : resetBearingLabel}
            shortcut="N"
            tooltipSide={tooltipSide}
            onClick={onResetBearing}
            icon={
              <div
                className="relative flex h-4 w-4 items-center justify-center transition-transform duration-200"
                style={{ transform: `rotate(${-bearing}deg)` }}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Outer ring */}
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-muted-foreground/30"
                  />
                  {/* North needle tip (red) pointing to magnetic north */}
                  <polygon points="12,3 15.5,12 8.5,12" fill="#ef4444" />
                  {/* South needle tip */}
                  <polygon
                    points="12,21 8.5,12 15.5,12"
                    fill="currentColor"
                    className="text-muted-foreground/50"
                  />
                  {/* Center pivot */}
                  <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                </svg>
              </div>
            }
          />
        )}

        {/* 3D Tilt / Pitch Toggle */}
        {show3DToggle && onToggle3D && (
          <MapControlButton
            label={is3D ? switchTo2DLabel : switchTo3DLabel}
            shortcut="3"
            tooltipSide={tooltipSide}
            active={is3D}
            onClick={onToggle3D}
            icon={<Box className="h-4 w-4" />}
          />
        )}

        {/* Geolocation: Vibrant solid blue rounded-xl button when active */}
        {showGeolocate && onGeolocate && (
          <MapControlButton
            label={findLocationLabel}
            tooltipSide={tooltipSide}
            loading={isLocating}
            active={isLocationActive}
            onClick={onGeolocate}
            className={cn(
              isLocationActive &&
                'bg-blue-600 text-white shadow-sm hover:bg-blue-700 rounded-xl focus-visible:ring-blue-500'
            )}
            icon={<Locate className="h-4 w-4" />}
          />
        )}

        {/* Divider between Camera and Display */}
        {hasCamera && hasDisplay && (
          <div className={dividerClass} />
        )}

        {/* 3. Display Controls: Layers toggle */}
        {showLayerToggle && onToggleLayerMenu && (
          <MapControlButton
            label={layersLabel}
            shortcut="L"
            tooltipSide={tooltipSide}
            active={isLayerMenuOpen}
            onClick={onToggleLayerMenu}
            icon={<Layers className="h-4 w-4" />}
          />
        )}

        {/* Fullscreen */}
        {showFullscreen && onToggleFullscreen && (
          <MapControlButton
            label={isFullscreen ? exitFullscreenLabel : enterFullscreenLabel}
            shortcut="F"
            tooltipSide={tooltipSide}
            active={isFullscreen}
            onClick={onToggleFullscreen}
            icon={
              isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )
            }
          />
        )}

        {children}
      </div>
    );
  }
);
FloatingMapControls.displayName = 'FloatingMapControls';
