// src/modules/EmergencyLighting/Sidebar/EmergencySidebar.tsx

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { toggleLayer, setActivePanel } from '@/modules/EmergencyLighting/store/emergencySlice';
import { loadRawGeometry } from '@/modules/EmergencyLighting/store/emergencyThunks';
import { SimulationResultsPanel } from '@/modules/EmergencyLighting/Sidebar/SimulationResultsPanel';
import { RoutesListPanel } from '@/modules/EmergencyLighting/Sidebar/RoutesListPanel';
import { ComplianceGroup } from '@/modules/EmergencyLighting/Toolbar/groups/ComplianceGroup';

export const EmergencySidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const layers = useAppSelector((s: any) => s.emergency.layerVisibility);
  const activePanel = useAppSelector((s: any) => s.emergency.ui.activePanel);
  const rawGeometryStatus = useAppSelector((s: any) => s.emergency.rawGeometry.status);

  const handleToggle = (key: string) => {
    const isEnabling = !(layers as any)[key];
    dispatch(toggleLayer(key as any));
    if (key === 'rawgeometry' && isEnabling && rawGeometryStatus === 'idle') {
      dispatch(loadRawGeometry());
    }
  };

  return (
    <div style={{ width: '320px', background: '#0F1424', borderRight: '1px solid #1E293B', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #1E293B' }}>
        <h2 style={{ color: '#FFF', fontSize: '14px', margin: 0 }}>Emergency Lighting</h2>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #1E293B' }}>
        {(['simulation', 'compliance', 'routes'] as const).map((panel) => (
          <button
            key={panel}
            onClick={() => dispatch(setActivePanel(panel))}
            style={{
              flex: 1, padding: '8px', background: activePanel === panel ? '#1E293B' : 'transparent',
              color: activePanel === panel ? '#38BDF8' : '#64748B',
              border: 'none', fontSize: '10px', cursor: 'pointer', textTransform: 'uppercase'
            }}
          >
            {panel}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
        <h3 style={{ color: '#94A3B8', fontSize: '10px', textTransform: 'uppercase' }}>Layers</h3>
        {Object.keys(layers).map((key) => {
          const label = key === 'rawgeometry' ? 'CAD Background' : key.replace(/([A-Z])/g, ' $1').trim();
          return (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#E2E8F0', fontSize: '12px', marginBottom: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={(layers as any)[key]}
                onChange={() => handleToggle(key)}
              />
              <span style={{ textTransform: 'capitalize' }}>
                {label}
                {key === 'rawgeometry' && rawGeometryStatus === 'loading' ? ' (loading...)' : ''}
              </span>
            </label>
          );
        })}

        <div style={{ borderTop: '1px solid #1E293B', marginTop: 12, paddingTop: 12 }}>
          {activePanel === 'simulation' && <SimulationResultsPanel />}
          {activePanel === 'compliance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <ComplianceGroup />
              <div style={{ color: '#64748B', fontSize: '11px', lineHeight: 1.5 }}>
                Add evacuation routes here. Routes are validated for wall crossings
                and 30m travel distance. See the Routes tab for per-route results.
              </div>
            </div>
          )}
          {activePanel === 'routes' && <RoutesListPanel />}
        </div>
      </div>
    </div>
  );
};

export default EmergencySidebar;