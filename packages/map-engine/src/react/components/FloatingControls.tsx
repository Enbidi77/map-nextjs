import React, { useState } from 'react';
import { useCamera } from '../hooks/useCamera.js';
import { useMapInstance } from '../hooks/useMapInstance.js';
import { GeolocationHandler } from '../../controls/geolocation.js';

export interface FloatingControlsProps {
  className?: string;
  style?: React.CSSProperties;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  showZoom?: boolean;
  showCompass?: boolean;
  show3DToggle?: boolean;
  showLocate?: boolean;
}

/**
 * Modern floating map controls stack.
 */
export const FloatingControls: React.FC<FloatingControlsProps> = ({
  className,
  style,
  position = 'top-right',
  showZoom = true,
  showCompass = true,
  show3DToggle = true,
  showLocate = true,
}) => {
  const { camera, zoomIn, zoomOut, resetBearing, toggle3D } = useCamera();
  const { map } = useMapInstance();
  const [isLocating, setIsLocating] = useState(false);

  const is3D = camera.pitch > 10;

  const handleLocate = async () => {
    if (!map) return;
    setIsLocating(true);
    try {
      const handler = new GeolocationHandler(map, {
        flyToUser: true,
        zoomLevel: 16,
      });
      await handler.locate();
    } catch (err) {
      console.warn('[FloatingControls] Geolocation error:', err);
    } finally {
      setIsLocating(false);
    }
  };

  const positionStyles: Record<string, React.CSSProperties> = {
    'top-right': { top: '16px', right: '16px' },
    'top-left': { top: '16px', left: '16px' },
    'bottom-right': { bottom: '32px', right: '16px' },
    'bottom-left': { bottom: '32px', left: '16px' },
  };

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    zIndex: 10,
    ...positionStyles[position],
    ...style,
  };

  const buttonStyle: React.CSSProperties = {
    width: '36px',
    height: '36px',
    backgroundColor: '#ffffff',
    border: '1px solid rgba(0, 0, 0, 0.12)',
    borderRadius: '8px',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#334155',
    fontSize: '16px',
    fontWeight: 600,
    padding: 0,
    userSelect: 'none',
    transition: 'all 0.15s ease',
  };

  return (
    <div className={`map-floating-controls ${className ?? ''}`} style={containerStyle}>
      {showZoom && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <button
            type="button"
            aria-label="Zoom in"
            title="Zoom In"
            style={buttonStyle}
            onClick={() => zoomIn(1)}
          >
            +
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            title="Zoom Out"
            style={buttonStyle}
            onClick={() => zoomOut(1)}
          >
            −
          </button>
        </div>
      )}

      {showCompass && (
        <button
          type="button"
          aria-label="Reset North"
          title={`Reset North (Bearing: ${Math.round(camera.bearing)}°)`}
          style={buttonStyle}
          onClick={() => resetBearing()}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            style={{
              transform: `rotate(${-camera.bearing}deg)`,
              transition: 'transform 0.2s ease-out',
            }}
          >
            {/* North pointer (red) */}
            <polygon points="12,2 17,12 12,9" fill="#ef4444" />
            <polygon points="12,2 7,12 12,9" fill="#f87171" />
            {/* South pointer (slate) */}
            <polygon points="12,22 17,12 12,15" fill="#64748b" />
            <polygon points="12,22 7,12 12,15" fill="#94a3b8" />
          </svg>
        </button>
      )}

      {show3DToggle && (
        <button
          type="button"
          aria-label="Toggle 3D View"
          title={is3D ? 'Switch to 2D nadir view' : 'Switch to 3D perspective view'}
          style={{
            ...buttonStyle,
            color: is3D ? '#3b82f6' : '#64748b',
            fontWeight: 700,
            fontSize: '11px',
            backgroundColor: is3D ? '#eff6ff' : '#ffffff',
            borderColor: is3D ? '#3b82f6' : 'rgba(0, 0, 0, 0.12)',
          }}
          onClick={() => toggle3D(60)}
        >
          {is3D ? '2D' : '3D'}
        </button>
      )}

      {showLocate && (
        <button
          type="button"
          aria-label="Locate me"
          title="Find my location"
          style={{
            ...buttonStyle,
            color: isLocating ? '#3b82f6' : '#475569',
          }}
          onClick={handleLocate}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="7" />
            <line x1="12" y1="2" x2="12" y2="5" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="2" y1="12" x2="5" y2="12" />
            <line x1="19" y1="12" x2="22" y2="12" />
          </svg>
        </button>
      )}
    </div>
  );
};
