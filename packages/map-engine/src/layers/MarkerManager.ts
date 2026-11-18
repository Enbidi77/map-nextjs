import maplibregl, { Marker, Popup } from 'maplibre-gl';
import type { Coordinate, MarkerOptions } from '../types.js';

export interface ManagedMarker {
  id: string;
  marker: Marker;
  coordinate: Coordinate;
  popup?: Popup;
}

/**
 * Manages HTML/GL Markers and popups on the map.
 */
export class MarkerManager {
  private _map: any;
  private _markers: Map<string, ManagedMarker> = new Map();

  constructor(map: unknown) {
    this._map = map;
  }

  /**
   * Adds or updates a marker on the map.
   */
  addMarker(id: string, coordinate: Coordinate, options: MarkerOptions = {}): ManagedMarker | null {
    if (!this._map) return null;

    if (this._markers.has(id)) {
      this.updateMarker(id, coordinate);
      return this._markers.get(id)!;
    }

    try {
      const markerInstance = new maplibregl.Marker({
        element: options.element,
        color: options.color ?? '#3b82f6',
        draggable: options.draggable ?? false,
      });

      markerInstance.setLngLat([coordinate[0], coordinate[1]]);

      // Attach popup if provided
      let popupInstance: Popup | undefined;
      if (options.popup) {
        popupInstance = new maplibregl.Popup({
          offset: options.popupOptions?.offset ?? 25,
          closeButton: options.popupOptions?.closeButton ?? true,
          closeOnClick: options.popupOptions?.closeOnClick ?? false,
        });

        if (typeof options.popup === 'string') {
          popupInstance.setHTML(options.popup);
        } else {
          popupInstance.setDOMContent(options.popup);
        }

        markerInstance.setPopup(popupInstance);
      }

      // Drag event
      if (options.draggable && options.onDragEnd) {
        markerInstance.on('dragend', () => {
          const lngLat = markerInstance.getLngLat();
          options.onDragEnd!([lngLat.lng, lngLat.lat]);
        });
      }

      // Click event
      if (options.onClick && options.element) {
        options.element.addEventListener('click', () => {
          options.onClick!();
        });
      }

      markerInstance.addTo(this._map);

      const entry: ManagedMarker = {
        id,
        marker: markerInstance,
        coordinate,
        popup: popupInstance,
      };

      this._markers.set(id, entry);
      return entry;
    } catch (err) {
      console.error(`[MapEngine] Failed to add marker ${id}:`, err);
      return null;
    }
  }

  /**
   * Updates marker position.
   */
  updateMarker(id: string, coordinate: Coordinate): void {
    const entry = this._markers.get(id);
    if (!entry) return;

    entry.marker.setLngLat([coordinate[0], coordinate[1]]);
    entry.coordinate = coordinate;
  }

  /**
   * Removes a marker.
   */
  removeMarker(id: string): void {
    const entry = this._markers.get(id);
    if (!entry) return;

    try {
      entry.marker.remove();
    } catch {
      // Safe removal
    }
    this._markers.delete(id);
  }

  /**
   * Gets a managed marker.
   */
  getMarker(id: string): ManagedMarker | undefined {
    return this._markers.get(id);
  }

  /**
   * Clears all markers.
   */
  clear(): void {
    for (const [id] of this._markers) {
      this.removeMarker(id);
    }
    this._markers.clear();
  }
}
