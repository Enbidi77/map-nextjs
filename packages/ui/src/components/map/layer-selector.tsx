import * as React from 'react';
import { Check, Eye, EyeOff, Layers, Sliders } from 'lucide-react';
import { cn } from '../../lib/utils.js';
import { Slider } from '../slider.js';
import { Card, CardContent, CardHeader, CardTitle } from '../card.js';

export interface MapStyleOption {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  gradient?: string;
}

export interface MapOverlayOption {
  id: string;
  name: string;
  description?: string;
  visible: boolean;
  opacity?: number;
}

export const DEFAULT_MAP_STYLES: MapStyleOption[] = [
  {
    id: 'streets',
    name: 'Streets',
    description: 'Standard vector street map',
    gradient: 'from-blue-200 via-emerald-100 to-amber-100 dark:from-slate-700 dark:via-zinc-800 dark:to-stone-800',
  },
  {
    id: 'satellite',
    name: 'Satellite',
    description: 'High-res aerial imagery',
    gradient: 'from-emerald-900 via-teal-950 to-stone-900',
  },
  {
    id: 'terrain',
    name: 'Terrain',
    description: 'Topographic contours & shaded relief',
    gradient: 'from-amber-200 via-stone-300 to-emerald-200 dark:from-stone-800 dark:via-amber-950 dark:to-stone-900',
  },
  {
    id: 'dark',
    name: 'Dark Matter',
    description: 'Sleek dark cartography for night view',
    gradient: 'from-slate-950 via-zinc-900 to-neutral-900',
  },
  {
    id: 'light',
    name: 'Positron Light',
    description: 'Minimalist high-contrast light map',
    gradient: 'from-slate-100 via-zinc-50 to-gray-200 dark:from-slate-800 dark:via-zinc-700 dark:to-stone-700',
  },
  {
    id: 'outdoors',
    name: 'Outdoors',
    description: 'Hiking trails, parks, and natural features',
    gradient: 'from-green-200 via-emerald-300 to-lime-200 dark:from-emerald-950 dark:via-green-900 dark:to-stone-800',
  },
];

export interface LayerSelectorProps extends React.HTMLAttributes<HTMLDivElement> {
  styles?: MapStyleOption[];
  activeStyleId: string;
  onSelectStyle: (styleId: string) => void;
  overlays?: MapOverlayOption[];
  onToggleOverlay?: (overlayId: string, visible: boolean) => void;
  onOverlayOpacityChange?: (overlayId: string, opacity: number) => void;
  showOverlays?: boolean;
}

export const LayerSelector = React.forwardRef<HTMLDivElement, LayerSelectorProps>(
  (
    {
      className,
      styles = DEFAULT_MAP_STYLES,
      activeStyleId,
      onSelectStyle,
      overlays = [],
      onToggleOverlay,
      onOverlayOpacityChange,
      showOverlays = true,
      ...props
    },
    ref
  ) => {
    return (
      <Card
        ref={ref}
        className={cn(
          'w-80 border-border/70 bg-background/95 backdrop-blur-md shadow-xl',
          className
        )}
        {...props}
      >
        <CardHeader className="p-4 pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Layers className="h-4 w-4 text-primary" />
            <span>Map Styles & Layers</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 p-4 pt-1">
          {/* Base Map Styles Grid */}
          <div>
            <div className="mb-2 text-xs font-medium text-muted-foreground">
              Base Map Style
            </div>
            <div className="grid grid-cols-3 gap-2">
              {styles.map((style) => {
                const isActive = style.id === activeStyleId;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => onSelectStyle(style.id)}
                    className={cn(
                      'group relative flex flex-col items-center rounded-lg border p-1 text-center transition-all duration-150',
                      isActive
                        ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                        : 'border-border/60 hover:border-border hover:bg-muted/50'
                    )}
                  >
                    {/* Thumbnail preview container */}
                    <div
                      className={cn(
                        'relative mb-1.5 h-12 w-full overflow-hidden rounded-md border border-border/40 bg-gradient-to-br shadow-inner',
                        style.gradient || 'from-sky-100 to-indigo-100 dark:from-slate-800 dark:to-indigo-950'
                      )}
                    >
                      {/* Optional custom thumbnail image */}
                      {style.thumbnail && (
                        <img
                          src={style.thumbnail}
                          alt={style.name}
                          className="h-full w-full object-cover"
                        />
                      )}

                      {/* Active Checkmark Badge */}
                      {isActive && (
                        <div className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    {/* Label */}
                    <span
                      className={cn(
                        'truncate text-[11px] font-medium leading-tight',
                        isActive ? 'text-primary font-semibold' : 'text-foreground'
                      )}
                    >
                      {style.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Overlays / Features Section */}
          {showOverlays && overlays.length > 0 && (
            <div className="border-t border-border/60 pt-3">
              <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>Overlay Layers</span>
                <Sliders className="h-3.5 w-3.5" />
              </div>

              <div className="space-y-2.5">
                {overlays.map((overlay) => (
                  <div
                    key={overlay.id}
                    className="flex flex-col gap-1.5 rounded-lg border border-border/40 bg-muted/20 p-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">
                        {overlay.name}
                      </span>
                      {onToggleOverlay && (
                        <button
                          type="button"
                          onClick={() => onToggleOverlay(overlay.id, !overlay.visible)}
                          className={cn(
                            'flex h-6 w-6 items-center justify-center rounded-md transition-colors',
                            overlay.visible
                              ? 'bg-primary/10 text-primary hover:bg-primary/20'
                              : 'text-muted-foreground hover:bg-muted'
                          )}
                          title={overlay.visible ? 'Hide layer' : 'Show layer'}
                        >
                          {overlay.visible ? (
                            <Eye className="h-3.5 w-3.5" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Opacity Slider if visible */}
                    {overlay.visible && onOverlayOpacityChange && (
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] text-muted-foreground">Opacity</span>
                        <Slider
                          value={[Math.round((overlay.opacity ?? 1) * 100)]}
                          min={10}
                          max={100}
                          step={5}
                          onValueChange={(val) => {
                            const newOpacity = (val[0] ?? 100) / 100;
                            onOverlayOpacityChange(overlay.id, newOpacity);
                          }}
                          className="flex-1"
                        />
                        <span className="w-6 text-right font-mono text-[10px] text-muted-foreground">
                          {Math.round((overlay.opacity ?? 1) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);
LayerSelector.displayName = 'LayerSelector';
