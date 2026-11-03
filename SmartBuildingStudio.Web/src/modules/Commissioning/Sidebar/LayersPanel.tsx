// src/modules/Commissioning/Sidebar/LayersPanel.tsx

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { toggleLayer } from '@/modules/Commissioning/store/commissioningSlice';
import { selectLayerVisibility } from '@/modules/Commissioning/store/commissioningSelectors';

const LAYERS = [
  { id: 'walls', label: 'Walls' },
  { id: 'doors', label: 'Doors' },
  { id: 'windows', label: 'Windows' },
  { id: 'rooms', label: 'Rooms' },
  { id: 'fixtures', label: 'Fixtures' },
  { id: 'rawgeometry', label: 'Raw Geometry' },
  { id: 'devices', label: 'Discovered Devices' },
  { id: 'topology', label: 'Network Topology' },
  { id: 'faults', label: 'Faults' },
  { id: 'signals', label: 'Signal Checks' },
];

export const LayersPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const visibility = useAppSelector(selectLayerVisibility);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          color: '#38BDF8', 
          fontSize: 11, 
          fontWeight: 'bold', 
          textTransform: 'uppercase', 
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <span style={{ fontSize: 10, width: 12, display: 'inline-block' }}>
          {isOpen ? '▼' : '▶'}
        </span>
        Layers
      </div>

      {isOpen && (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 6, 
          marginLeft: 18,
          maxHeight: 250,
          overflowY: 'auto',
          paddingRight: 4,
        }}>
          {LAYERS.map(layer => {
            const isVisible = visibility[layer.id] !== false;
            return (
              <label 
                key={layer.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  fontSize: 11, 
                  color: isVisible ? '#E5E7EB' : '#64748B', 
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={() => dispatch(toggleLayer(layer.id))}
                  style={{ cursor: 'pointer', accentColor: '#38BDF8' }}
                />
                {layer.label}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};