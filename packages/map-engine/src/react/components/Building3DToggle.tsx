import React, { useState } from 'react';
import { useMapInstance } from '../hooks/useMapInstance.js';

export interface Building3DToggleProps {
  className?: string;
  style?: React.CSSProperties;
  onToggle?: (enabled: boolean) => void;
}

/**
 * Toggle button for 3D building extrusion layer.
 */
export const Building3DToggle: React.FC<Building3DToggleProps> = ({
  className,
  style,
  onToggle,
}) => {
  const { layerManager, isLoaded } = useMapInstance();
  const [enabled, setEnabled] = useState(false);

  const handleToggle = () => {
    if (!layerManager || !isLoaded) return;
    const next = layerManager.toggle3DBuildings();
    setEnabled(next);
    onToggle?.(next);
  };

  return (
    <button
      type="button"
      className={`map-3d-buildings-toggle ${className ?? ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        backgroundColor: enabled ? '#3b82f6' : '#ffffff',
        color: enabled ? '#ffffff' : '#334155',
        border: '1px solid rgba(0,0,0,0.12)',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 600,
        cursor: 'pointer',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        userSelect: 'none',
        ...style,
      }}
      onClick={handleToggle}
      title={enabled ? 'Disable 3D Buildings' : 'Enable 3D Buildings'}
    >
      🏢 3D Buildings
    </button>
  );
};
