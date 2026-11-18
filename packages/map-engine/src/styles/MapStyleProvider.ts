import type { EngineMapStyle } from '../types.js';
import { MAP_STYLES, DEFAULT_STYLE_ID, createRasterStyle } from './styles.js';

export type StyleChangeListener = (style: EngineMapStyle) => void;
export type FallbackListener = (failedStyleId: string, fallbackStyle: EngineMapStyle, error?: Error) => void;

/**
 * Production Map Style Provider and Registry with fallback management.
 */
export class MapStyleProvider {
  private _styles: Map<string, EngineMapStyle> = new Map();
  private _currentStyleId: string = DEFAULT_STYLE_ID;
  private _changeListeners: Set<StyleChangeListener> = new Set();
  private _fallbackListeners: Set<FallbackListener> = new Set();

  constructor(initialStyles: Record<string, EngineMapStyle> = MAP_STYLES) {
    for (const [id, style] of Object.entries(initialStyles)) {
      this._styles.set(id, { ...style });
    }
  }

  /**
   * Returns all registered styles.
   */
  getAllStyles(): EngineMapStyle[] {
    return Array.from(this._styles.values());
  }

  /**
   * Gets a style by ID, or fallback to default style if not found.
   */
  getStyle(id: string): EngineMapStyle {
    const style = this._styles.get(id);
    if (!style) {
      const defaultStyle = this._styles.get(DEFAULT_STYLE_ID);
      if (defaultStyle) return defaultStyle;
      // Fallback emergency style
      return MAP_STYLES.streets!;
    }
    return style;
  }

  /**
   * Returns current active style.
   */
  getCurrentStyle(): EngineMapStyle {
    return this.getStyle(this._currentStyleId);
  }

  /**
   * Registers or updates a map style.
   */
  registerStyle(style: EngineMapStyle): void {
    this._styles.set(style.id, style);
  }

  /**
   * Sets current active style ID and notifies listeners.
   */
  setStyle(id: string): EngineMapStyle {
    const style = this.getStyle(id);
    this._currentStyleId = style.id;
    for (const listener of this._changeListeners) {
      listener(style);
    }
    return style;
  }

  /**
   * Resolves appropriate style based on dark mode setting.
   */
  getThemeStyle(isDark: boolean): EngineMapStyle {
    return isDark ? this.getStyle('dark') : this.getStyle('light');
  }

  /**
   * Resolves fallback style when primary style encounters network or rendering failure.
   */
  resolveFallback(failedStyleIdOrUrl: string, error?: Error): EngineMapStyle {
    let failedStyle: EngineMapStyle | undefined;

    // Search by ID or URL
    for (const style of this._styles.values()) {
      if (style.id === failedStyleIdOrUrl || style.url === failedStyleIdOrUrl) {
        failedStyle = style;
        break;
      }
    }

    let fallbackStyle: EngineMapStyle;

    if (failedStyle?.styleObject) {
      // Use pre-computed offline/safe raster style object
      fallbackStyle = failedStyle;
    } else if (failedStyle?.rasterFallbackTiles && failedStyle.rasterFallbackTiles.length > 0) {
      fallbackStyle = {
        ...failedStyle,
        styleObject: createRasterStyle({
          tiles: failedStyle.rasterFallbackTiles,
          attribution: failedStyle.attribution,
        }),
      };
    } else {
      // General fallback to standard OSM raster
      fallbackStyle = this.getStyle('streets');
    }

    for (const listener of this._fallbackListeners) {
      listener(failedStyleIdOrUrl, fallbackStyle, error);
    }

    return fallbackStyle;
  }

  /**
   * Subscribe to style changes.
   */
  onStyleChange(listener: StyleChangeListener): () => void {
    this._changeListeners.add(listener);
    return () => this._changeListeners.delete(listener);
  }

  /**
   * Subscribe to fallback events.
   */
  onFallback(listener: FallbackListener): () => void {
    this._fallbackListeners.add(listener);
    return () => this._fallbackListeners.delete(listener);
  }
}

/**
 * Singleton style provider instance.
 */
export const defaultStyleProvider = new MapStyleProvider();
