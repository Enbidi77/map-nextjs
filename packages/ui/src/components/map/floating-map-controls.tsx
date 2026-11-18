import * as React from 'react';
import {
  Plus,
  Minus,
  Compass,
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
                'group relative flex h-9 w-9 items-center justify-center rounded-md text-foreground transition-all duration-150',
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
      children,
      ...props
    },
    ref
  ) => {
    const tooltipSide = position.includes('right') ? 'left' : 'right';

    return (
      <div
        ref={ref}
        className={cn(
          'absolute z-30 flex gap-1.5 p-1 rounded-lg border border-border/60 bg-background/85 shadow-lg backdrop-blur-md transition-all duration-200',
          orientation === 'vertical' ? 'flex-col' : 'flex-row items-center',
          position ? positionClasses[position] : '',
          className
        )}
        {...props}
      >
        {/* Zoom controls */}
        {onZoomIn && (
          <MapControlButton
            label="Zoom in"
            shortcut="+"
            tooltipSide={tooltipSide}
            disabled={zoomDisabled}
            onClick={onZoomIn}
            icon={<Plus className="h-4 w-4" />}
          />
        )}
        {onZoomOut && (
          <MapControlButton
            label="Zoom out"
            shortcut="-"
            tooltipSide={tooltipSide}
            disabled={zoomDisabled}
            onClick={onZoomOut}
            icon={<Minus className="h-4 w-4" />}
          />
        )}

        {/* Divider if zoom controls exist */}
        {(onZoomIn || onZoomOut) && (showCompass || show3DToggle || showGeolocate) && (
          <div
            className={cn(
              'bg-border/60',
              orientation === 'vertical' ? 'h-[1px] w-full my-0.5' : 'w-[1px] h-full mx-0.5'
            )}
          />
        )}

        {/* Compass / Reset North */}
        {showCompass && onResetBearing && (
          <MapControlButton
            label={bearing === 0 ? 'Orient North' : `Reset Bearing (${Math.round(bearing)}°)`}
            shortcut="N"
            tooltipSide={tooltipSide}
            onClick={onResetBearing}
            icon={
              <Compass
                className="h-4 w-4 transition-transform duration-200"
                style={{ transform: `rotate(${-bearing}deg)` }}
              />
            }
          />
        )}

        {/* 3D Tilt / Pitch Toggle */}
        {show3DToggle && onToggle3D && (
          <MapControlButton
            label={is3D ? 'Switch to 2D view' : 'Switch to 3D perspective'}
            shortcut="3"
            tooltipSide={tooltipSide}
            active={is3D}
            onClick={onToggle3D}
            icon={<Box className="h-4 w-4" />}
          />
        )}

        {/* Geolocation */}
        {showGeolocate && onGeolocate && (
          <MapControlButton
            label="Find my location"
            tooltipSide={tooltipSide}
            loading={isLocating}
            active={isLocationActive}
            onClick={onGeolocate}
            icon={<Locate className="h-4 w-4" />}
          />
        )}

        {/* Divider for modal/overlay controls */}
        {(showLayerToggle || showFullscreen) && (
          <div
            className={cn(
              'bg-border/60',
              orientation === 'vertical' ? 'h-[1px] w-full my-0.5' : 'w-[1px] h-full mx-0.5'
            )}
          />
        )}

        {/* Layers toggle */}
        {showLayerToggle && onToggleLayerMenu && (
          <MapControlButton
            label="Map layers & styles"
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
            label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
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
