import * as React from 'react';
import { Copy, Check, Crosshair } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export interface CoordinateBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  longitude: number;
  latitude: number;
  zoom?: number;
  pitch?: number;
  bearing?: number;
  scaleText?: string;
  format?: 'decimal' | 'dms';
  showCopyButton?: boolean;
  showElevation?: boolean;
  elevation?: number;
  copyTitle?: string;
  copiedTitle?: string;
}

/**
 * Formats a decimal degree coordinate into human-readable hemisphere notation.
 */
function formatCoordDecimal(lat: number, lng: number, precision: number = 4): string {
  const latHemi = lat >= 0 ? 'N' : 'S';
  const lngHemi = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(precision)}° ${latHemi}, ${Math.abs(lng).toFixed(precision)}° ${lngHemi}`;
}

/**
 * Formats coordinates into degrees, minutes, and seconds (DMS).
 */
function toDms(deg: number, isLat: boolean): string {
  const absolute = Math.abs(deg);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = Math.floor((minutesNotTruncated - minutes) * 60);
  const direction = isLat ? (deg >= 0 ? 'N' : 'S') : deg >= 0 ? 'E' : 'W';
  return `${degrees}°${minutes}′${seconds}″${direction}`;
}

export const CoordinateBadge = React.forwardRef<HTMLDivElement, CoordinateBadgeProps>(
  (
    {
      className,
      longitude,
      latitude,
      zoom,
      pitch,
      bearing,
      scaleText,
      format = 'decimal',
      showCopyButton = true,
      showElevation = false,
      elevation,
      copyTitle = 'Copy coordinates',
      copiedTitle = 'Coordinates copied',
      ...props
    },
    ref
  ) => {
    const [copied, setCopied] = React.useState(false);

    const formattedCoords =
      format === 'dms'
        ? `${toDms(latitude, true)} ${toDms(longitude, false)}`
        : formatCoordDecimal(latitude, longitude);

    const copyCoords = async () => {
      try {
        await navigator.clipboard.writeText(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Fallback or ignore
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-2.5 rounded-2xl border border-black/5 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 px-3 py-1.5 text-xs text-foreground shadow-lg backdrop-blur-xl select-none transition-all tabular-nums',
          className
        )}
        {...props}
      >
        {/* Coordinates with Crosshair / target icon on the left */}
        <div className="flex items-center gap-1.5 font-mono text-[11px] tabular-nums">
          <Crosshair className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="truncate tabular-nums font-medium">{formattedCoords}</span>
        </div>

        {/* Copy Button */}
        {showCopyButton && (
          <button
            type="button"
            onClick={copyCoords}
            className="flex h-5 w-5 items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title={copied ? copiedTitle : copyTitle}
            aria-label={copied ? copiedTitle : copyTitle}
          >
            {copied ? (
              <Check className="h-3 w-3 text-emerald-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        )}

        {/* Zoom */}
        {zoom !== undefined && (
          <>
            <span className="text-black/10 dark:text-white/10 select-none">|</span>
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
              z: {zoom.toFixed(1)}
            </span>
          </>
        )}

        {/* Pitch & Bearing (when 3D/rotated) */}
        {((pitch && pitch > 0) || (bearing && bearing !== 0)) && (
          <>
            <span className="text-black/10 dark:text-white/10 select-none">|</span>
            <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
              {pitch && pitch > 0 ? `P: ${Math.round(pitch)}° ` : ''}
              {bearing && bearing !== 0 ? `B: ${Math.round(bearing)}°` : ''}
            </span>
          </>
        )}

        {/* Elevation */}
        {showElevation && elevation !== undefined && (
          <>
            <span className="text-black/10 dark:text-white/10 select-none">|</span>
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
              {Math.round(elevation)}m
            </span>
          </>
        )}

        {/* Scale bar */}
        {scaleText && (
          <>
            <span className="text-black/10 dark:text-white/10 select-none">|</span>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-mono tabular-nums leading-none text-muted-foreground">
                {scaleText}
              </span>
              <div className="mt-0.5 h-[2px] w-7 bg-foreground/60 rounded-full" />
            </div>
          </>
        )}
      </div>
    );
  }
);
CoordinateBadge.displayName = 'CoordinateBadge';
