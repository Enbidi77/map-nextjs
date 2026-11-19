'use client';

import * as React from 'react';
import {
  Sparkles,
  Search,
  Activity,
  Laptop,
  Tablet,
  Smartphone,
  Palette,
  Check,
  ArrowRight,
} from 'lucide-react';
import { FeatureRibbonCard, Slider } from '@modern-maps/ui';

export interface FeatureRibbonDockProps {
  onSearchSubmit?: (query: string) => void;
  onPitchChange?: (pitch: number) => void;
  onAccentChange?: (color: string) => void;
  className?: string;
}

const ACCENT_COLORS = [
  { id: 'blue', name: 'Ocean Blue', bg: 'bg-blue-500', hex: '#3b82f6' },
  { id: 'emerald', name: 'Emerald', bg: 'bg-emerald-500', hex: '#10b981' },
  { id: 'purple', name: 'Violet', bg: 'bg-purple-500', hex: '#8b5cf6' },
  { id: 'rose', name: 'Rose', bg: 'bg-rose-500', hex: '#f43f5e' },
  { id: 'amber', name: 'Amber', bg: 'bg-amber-500', hex: '#f59e0b' },
];

export function FeatureRibbonDock({
  onSearchSubmit,
  onPitchChange,
  onAccentChange,
  className = '',
}: FeatureRibbonDockProps) {
  // Mini Search State
  const [miniQuery, setMiniQuery] = React.useState('');

  // Slider State (Map pitch / animation flow)
  const [sliderVal, setSliderVal] = React.useState<number[]>([45]);

  // Selected Accent Color
  const [selectedAccent, setSelectedAccent] = React.useState('blue');

  // Glass Specular Mode toggle
  const [specularActive, setSpecularActive] = React.useState(true);

  // Active Device Mode Preview
  const [activeDevice, setActiveDevice] = React.useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const handleSliderChange = (vals: number[]) => {
    setSliderVal(vals);
    if (vals[0] !== undefined && onPitchChange) {
      onPitchChange(vals[0]);
    }
  };

  const handleAccentSelect = (id: string, hex: string) => {
    setSelectedAccent(id);
    onAccentChange?.(hex);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Dock Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-foreground uppercase tracking-wider">
              Fusion Design System
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Google UI simplicity combined with Apple Liquid Glass craftsmanship
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono text-muted-foreground hidden sm:inline">
          5 Interactive Primitives
        </span>
      </div>

      {/* 5-Card Responsive Dock Grid / Scrollable Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Liquid Glass Design */}
        <FeatureRibbonCard
          icon={<Sparkles className="h-5 w-5 text-blue-500" />}
          title="Liquid Glass"
          description="Frosted depth & refraction"
          badge="Design"
          className="hover:border-blue-500/40"
        >
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-[11px] text-muted-foreground">Specular Sheen:</span>
            <button
              type="button"
              onClick={() => setSpecularActive(!specularActive)}
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-all ${
                specularActive
                  ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                  : 'bg-muted/40 text-muted-foreground'
              }`}
            >
              {specularActive ? 'Refractive ON' : 'Subtle'}
            </button>
          </div>
        </FeatureRibbonCard>

        {/* Card 2: Smart & Helpful */}
        <FeatureRibbonCard
          icon={<Search className="h-5 w-5 text-emerald-500" />}
          title="Smart & Helpful"
          description="Contextual geospatial AI"
          badge="Intel"
          className="hover:border-emerald-500/40"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (miniQuery.trim()) {
                onSearchSubmit?.(miniQuery.trim());
              }
            }}
            className="flex items-center gap-1.5 pt-1"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={miniQuery}
                onChange={(e) => setMiniQuery(e.target.value)}
                placeholder="Ask e.g. 'Coffee near Golden Gate'..."
                className="w-full rounded-xl border border-white/30 dark:border-white/10 bg-white/40 dark:bg-zinc-800/40 px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary backdrop-blur-md"
              />
            </div>
            <button
              type="submit"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 transition-colors"
              aria-label="Submit query"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>
        </FeatureRibbonCard>

        {/* Card 3: Fluid Motion */}
        <FeatureRibbonCard
          icon={<Activity className="h-5 w-5 text-indigo-500" />}
          title="Fluid Motion"
          description="Physics-based easing"
          badge={`${sliderVal[0]}° Pitch`}
          className="hover:border-indigo-500/40"
        >
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
              <span>2D Flat</span>
              <span>70° 3D Tilt</span>
            </div>
            <Slider
              value={sliderVal}
              min={0}
              max={70}
              step={5}
              onValueChange={handleSliderChange}
              className="py-1"
            />
          </div>
        </FeatureRibbonCard>

        {/* Card 4: Adaptive & Responsive */}
        <FeatureRibbonCard
          icon={<Laptop className="h-5 w-5 text-amber-500" />}
          title="Adaptive"
          description="Across any viewport"
          badge="Flex"
          className="hover:border-amber-500/40"
        >
          <div className="flex items-center justify-around gap-2 pt-1">
            <button
              type="button"
              onClick={() => setActiveDevice('desktop')}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-all ${
                activeDevice === 'desktop'
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Laptop className="h-3.5 w-3.5" />
              <span>Desk</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveDevice('tablet')}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-all ${
                activeDevice === 'tablet'
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Tablet className="h-3.5 w-3.5" />
              <span>Tab</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveDevice('mobile')}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-all ${
                activeDevice === 'mobile'
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Mob</span>
            </button>
          </div>
        </FeatureRibbonCard>

        {/* Card 5: Personal & Expressive */}
        <FeatureRibbonCard
          icon={<Palette className="h-5 w-5 text-rose-500" />}
          title="Expressive"
          description="Dynamic tint palettes"
          badge="Themes"
          className="hover:border-rose-500/40"
        >
          <div className="flex items-center justify-between gap-1 pt-1.5">
            {ACCENT_COLORS.map((accent) => (
              <button
                key={accent.id}
                type="button"
                onClick={() => handleAccentSelect(accent.id, accent.hex)}
                className={`group relative flex h-6 w-6 items-center justify-center rounded-full transition-transform ${
                  accent.bg
                } ${
                  selectedAccent === accent.id
                    ? 'scale-110 ring-2 ring-foreground/40 shadow-sm'
                    : 'hover:scale-105 opacity-80'
                }`}
                title={accent.name}
              >
                {selectedAccent === accent.id && (
                  <Check className="h-3.5 w-3.5 text-white stroke-[3]" />
                )}
              </button>
            ))}
          </div>
        </FeatureRibbonCard>
      </div>
    </div>
  );
}
