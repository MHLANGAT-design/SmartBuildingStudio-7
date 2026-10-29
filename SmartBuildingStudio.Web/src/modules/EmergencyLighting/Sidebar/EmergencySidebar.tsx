// src/modules/EmergencyLighting/Sidebar/EmergencySidebar.tsx

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { toggleLayer } from '@/modules/EmergencyLighting/store/emergencySlice';
import { loadRawGeometry } from '@/modules/EmergencyLighting/store/emergencyThunks';
import { RoutesListPanel } from '@/modules/EmergencyLighting/Sidebar/RoutesListPanel';
import { EmergencyFixtureListPanel } from '@/modules/EmergencyLighting/Sidebar/EmergencyFixtureListPanel';
import { ExitSignListPanel } from '@/modules/EmergencyLighting/Sidebar/ExitSignListPanel';
import { ZoneListPanel } from '@/modules/EmergencyLighting/Sidebar/ZoneListPanel';

type SidebarView = 'elements' | 'layers';

export const EmergencySidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const layers = useAppSelector((s: any) => s.emergency.layerVisibility);
  const rawGeometryStatus = useAppSelector((s: any) => s.emergency.rawGeometry.status);
  
  const [activeView, setActiveView] = useState<SidebarView>('elements');

  const handleToggle = (key: string) => {
    const isEnabling = !(layers as any)[key];
    dispatch(toggleLayer(key as any));
    if (key === 'rawgeometry' && isEnabling && rawGeometryStatus === 'idle') {
      dispatch(loadRawGeometry());
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      height: '100%', 
      borderRight: '1px solid #1E293B' 
    }}>
      
      {/* ─── Left Rail (Navigation) ─────────────────────────────────── */}
      <div
        style={{
          width: 56,
          background: '#090D16',
          borderRight: '1px solid #1E293B',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 12,
          gap: 16,
          flexShrink: 0,
        }}
      >
        <RailButton
          label="Elements"
          icon="📋"
          active={activeView === 'elements'}
          onClick={() => setActiveView('elements')}
        />
        <RailButton
          label="Layers"
          icon="📚"
          active={activeView === 'layers'}
          onClick={() => setActiveView('layers')}
        />
      </div>

      {/* ─── Content Panel ──────────────────────────────────────────── */}
      <aside
        style={{
          width: 260,
          background: '#0F1424',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        {/* Fixed Header */}
        <div style={{ 
          padding: '12px 16px', 
          borderBottom: '1px solid #1E293B', 
          flexShrink: 0,
          background: '#0F1424',
        }}>
          <h2 style={{ color: '#FFF', fontSize: 13, margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {activeView === 'elements' ? 'Elements' : 'Layers'}
          </h2>
        </div>

        {/* Scrollable Content — Absolute Positioning forces scroll boundaries */}
        <div style={{ 
          flex: 1, 
          position: 'relative', // Container for absolute child
          overflow: 'hidden'
        }}>
          <div style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflowY: 'auto', 
            padding: 8 
          }}>
            {activeView === 'elements' && (
              <>
                <RoutesListPanel />
                <EmergencyFixtureListPanel />
                <ExitSignListPanel />
                <ZoneListPanel />
              </>
            )}

            {activeView === 'layers' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '4px 8px' }}>
                {Object.keys(layers).map((key) => {
                  const label = key === 'rawgeometry' ? 'CAD Background' : key.replace(/([A-Z])/g, ' $1').trim();
                  return (
                    <label
                      key={key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        color: '#E2E8F0',
                        fontSize: 12,
                        marginBottom: 6,
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={(layers as any)[key]}
                        onChange={() => handleToggle(key)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ textTransform: 'capitalize' }}>
                        {label}
                        {key === 'rawgeometry' && rawGeometryStatus === 'loading' ? ' (loading...)' : ''}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};

// Simple internal component for the vertical rail buttons
const RailButton: React.FC<{ label: string; icon: string; active: boolean; onClick: () => void }> = ({ label, icon, active, onClick }) => (
  <button
    onClick={onClick}
    title={label}
    style={{
      background: 'transparent',
      border: 'none',
      color: active ? '#38BDF8' : '#64748B',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
      cursor: 'pointer',
      width: '100%',
      padding: '8px 0',
      borderLeft: `3px solid ${active ? '#38BDF8' : 'transparent'}`,
    }}
  >
    <span style={{ fontSize: 16 }}>{icon}</span>
    <span style={{ fontSize: 9, fontFamily: 'monospace' }}>{label}</span>
  </button>
);

export default EmergencySidebar;