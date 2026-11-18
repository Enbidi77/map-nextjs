import React from 'react';
import { useCamera } from '../hooks/useCamera.js';
import { calculateScale } from '../../controls/scale.js';
import { formatCoordinates } from '@modern-maps/geospatial';

export interface CoordinateBadgeProps {
  className?: string;
  style?: React.CSSProperties;
  position?: 'bottom-left' | 'bottom-right';
  showScale?: boolean;
  showCoordinates?: boolean;
  format?: 'dd' | 'dms';
}

/**
 * Coordinate and scale bar readout badge.
 */
export const CoordinateBadge: React.FC<CoordinateBadgeProps> = ({
  className,
  style,
  position = 'bottom-left',
  showScale = true,
  showCoordinates = true,
  format = 'dd',
}) => {
  const { camera } = useCamera();

  const [lng, lat] = camera.center;
  const scale = calculateScale(lat, camera.zoom, 90);
  const formattedCoords = formatCoordinates([lng, lat], format, 4);

  const positionStyles: Record<string, React.CSSProperties> = {
    'bottom-left': { bottom: '8px', left: '8px' },
    'bottom-right': { bottom: '8px', right: '8px' },
  };

  const badgeStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(4px)',
    padding: '4px 10px',
    borderRadius: '6px',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
    fontSize: '11px',
    fontFamily: 'monospace, system-ui, sans-serif',
    color: '#334155',
    userSelect: 'none',
    pointerEvents: 'none',
    ...positionStyles[position],
    ...style,
  };

  return (
    <div className={`map-coordinate-badge ${className ?? ''}`} style={badgeStyle}>
      {showCoordinates && (
        <span title={`Coordinates: ${formattedCoords} | Zoom: ${camera.zoom.toFixed(1)}`}>
          {formattedCoords} · z{camera.zoom.toFixed(1)}
        </span>
      )}

      {showScale && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              width: `${scale.metricWidthPx}px`,
              height: '3px',
              borderBottom: '2px solid #334155',
              borderLeft: '2px solid #334155',
              borderRight: '2px solid #334155',
              marginBottom: '1px',
            }}
          />
          <span style={{ fontSize: '9px', lineHeight: '10px' }}>
            {scale.metricLabel}
          </span>
        </div>
      )}
    </div>
  );
};
