import React from 'react';
import { useMeasurement } from '../hooks/useMeasurement.js';

export interface MeasurementToolbarProps {
  className?: string;
  style?: React.CSSProperties;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  unitSystem?: 'metric' | 'imperial';
}

/**
 * Floating toolbar for interactive distance and area measurements.
 */
export const MeasurementToolbar: React.FC<MeasurementToolbarProps> = ({
  className,
  style,
  position = 'top-left',
  unitSystem = 'metric',
}) => {
  const {
    mode,
    setMode,
    formattedDistance,
    formattedArea,
    points,
    isMeasuring,
    clear,
    undo,
  } = useMeasurement(unitSystem);

  const positionStyles: Record<string, React.CSSProperties> = {
    'top-left': { top: '16px', left: '16px' },
    'top-right': { top: '16px', right: '70px' },
    'bottom-left': { bottom: '40px', left: '16px' },
    'bottom-right': { bottom: '40px', right: '70px' },
  };

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
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
    backgroundColor: active ? '#10b981' : '#f1f5f9',
    color: active ? '#ffffff' : '#334155',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  });

  return (
    <div className={`map-measurement-toolbar ${className ?? ''}`} style={containerStyle}>
      <button
        type="button"
        style={buttonStyle(mode === 'distance')}
        onClick={() => setMode(mode === 'distance' ? 'none' : 'distance')}
        title="Measure Distance along line"
      >
        📏 Distance
      </button>

      <button
        type="button"
        style={buttonStyle(mode === 'area')}
        onClick={() => setMode(mode === 'area' ? 'none' : 'area')}
        title="Measure Area of polygon"
      >
        📐 Area
      </button>

      {isMeasuring && (
        <>
          {points.length > 0 && (
            <button
              type="button"
              style={{
                padding: '4px 6px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: '#f1f5f9',
                cursor: 'pointer',
              }}
              onClick={undo}
              title="Undo last point"
            >
              ↩ Undo
            </button>
          )}

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
            onClick={clear}
            title="Clear measurement"
          >
            ✕ Clear
          </button>

          {/* Current readout */}
          <div
            style={{
              fontWeight: 600,
              paddingLeft: '4px',
              color: '#059669',
              minWidth: '60px',
            }}
          >
            {mode === 'distance' ? formattedDistance : formattedArea}
          </div>
        </>
      )}
    </div>
  );
};
