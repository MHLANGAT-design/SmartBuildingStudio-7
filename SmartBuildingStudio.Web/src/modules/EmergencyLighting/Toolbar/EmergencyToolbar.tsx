// src/modules/EmergencyLighting/Toolbar/EmergencyToolbar.tsx

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { toggleLayer } from '@/modules/EmergencyLighting/store/emergencySlice';
import { runEmergencyHeatmap } from '@/modules/EmergencyLighting/store/emergencyThunks';

export const EmergencyToolbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const heatmapVisible = useAppSelector((s: any) => s.emergency.layerVisibility.heatmap);
  const heatmapStatus = useAppSelector((s: any) => s.emergency.heatmap.status);
  const hasModel = useAppSelector((s: any) => !!s.emergency.floorplan.model);

  const isRunning = heatmapStatus === 'running';

  const handleHeatmapToggle = () => {
    const nextVisible = !heatmapVisible;
    dispatch(toggleLayer('heatmap'));
    // Lazy trigger: only compute if turning on AND no data yet AND not already running
    if (
      nextVisible &&
      heatmapStatus === 'idle' &&
      hasModel &&
      !isRunning
    ) {
      dispatch(runEmergencyHeatmap({ resolutionMeters: 0.5, heightMeters: 0.8 }) as any);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        minHeight: '44px',
        padding: '0 16px',
        background: '#0F1424',
        borderBottom: '1px solid #1E293B',
        color: '#E2E8F0',
        fontFamily: 'monospace',
        boxSizing: 'border-box',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          color: '#94A3B8',
          fontSize: 11,
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Emergency Lighting
      </span>

      <button
        type="button"
        onClick={handleHeatmapToggle}
        disabled={!hasModel || isRunning}
        title="Toggle illuminance heatmap"
        style={{
          background: heatmapVisible ? 'rgba(56,189,248,0.15)' : 'rgba(56,189,248,0.05)',
          border: `1px solid ${heatmapVisible ? '#38BDF8' : '#334155'}`,
          color: heatmapVisible ? '#38BDF8' : '#64748B',
          padding: '4px 10px',
          borderRadius: 4,
          fontFamily: 'monospace',
          fontSize: 11,
          fontWeight: 'bold',
          cursor: isRunning ? 'wait' : (!hasModel ? 'not-allowed' : 'pointer'),
          opacity: !hasModel ? 0.5 : 1,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {isRunning
          ? '🔥 Computing…'
          : heatmapVisible
          ? '🔥 Heatmap ON'
          : '🔥 Heatmap'}
      </button>
    </div>
  );
};

export default EmergencyToolbar;