import React from 'react';
import { useDrawing } from '../hooks/useDrawing.js';
import type { DrawingMode } from '../../drawing/DrawingTool.js';

export interface DrawingToolbarProps {
  className?: string;
  style?: React.CSSProperties;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  onExport?: (geoJson: string) => void;
}

/**
 * Floating toolbar for drawing vector points, lines, and polygons.
 */
export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  className,
  style,
  position = 'top-left',
  onExport,
}) => {
  const {
    mode,
    setMode,
    features,
    selectedFeature,
    deleteSelectedFeature,
    clear,
    exportGeoJSON,
  } = useDrawing();

  const positionStyles: Record<string, React.CSSProperties> = {
    'top-left': { top: '56px', left: '16px' },
    'top-right': { top: '56px', right: '70px' },
    'bottom-left': { bottom: '80px', left: '16px' },
    'bottom-right': { bottom: '80px', right: '70px' },
  };

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#ffffff',
    padding: '4px 8px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
    border: '1px solid rgba(0,0,0,0.1)',
    zIndex: 10,
    fontSize: '12px',
    fontFamily: 'system-ui, sans-serif',
    color: '#334155',
    ...positionStyles[position],
    ...style,
  };

  const buttonStyle = (active: boolean): React.CSSProperties => ({
    padding: '4px 8px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: active ? '#3b82f6' : '#f1f5f9',
    color: active ? '#ffffff' : '#334155',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  });

  const modes: { id: DrawingMode; label: string; icon: string }[] = [
    { id: 'point', label: 'Point', icon: '📍' },
    { id: 'line', label: 'Line', icon: '〰️' },
    { id: 'polygon', label: 'Polygon', icon: '⬡' },
    { id: 'select', label: 'Select', icon: '👆' },
  ];

  const handleExport = () => {
    const geoJson = exportGeoJSON();
    onExport?.(geoJson);
  };

  return (
    <div className={`map-drawing-toolbar ${className ?? ''}`} style={containerStyle}>
      {modes.map((m) => (
        <button
          key={m.id}
          type="button"
          style={buttonStyle(mode === m.id)}
          onClick={() => setMode(mode === m.id ? 'none' : m.id)}
          title={`Draw ${m.label}`}
        >
          {m.icon} {m.label}
        </button>
      ))}

      {selectedFeature && (
        <button
          type="button"
          style={{
            padding: '4px 6px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: '#fee2e2',
            color: '#ef4444',
            cursor: 'pointer',
          }}
          onClick={deleteSelectedFeature}
          title="Delete selected feature"
        >
          🗑️ Delete
        </button>
      )}

      {features.features.length > 0 && (
        <>
          <button
            type="button"
            style={{
              padding: '4px 6px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#f1f5f9',
              cursor: 'pointer',
            }}
            onClick={clear}
            title="Clear all drawings"
          >
            Clear
          </button>

          <button
            type="button"
            style={{
              padding: '4px 6px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#f1f5f9',
              cursor: 'pointer',
            }}
            onClick={handleExport}
            title="Export GeoJSON"
          >
            Export
          </button>
        </>
      )}
    </div>
  );
};
