// src/modules/EmergencyLighting/Toolbar/EmergencyToolbar.tsx

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { toggleLayer } from '@/modules/EmergencyLighting/store/emergencySlice';
import {
  runEmergencyHeatmap,
  saveEmergencyRoutes,
} from '@/modules/EmergencyLighting/store/emergencyThunks';

export const EmergencyToolbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const heatmapVisible = useAppSelector((s: any) => s.emergency.layerVisibility.heatmap);
  const heatmapStatus = useAppSelector((s: any) => s.emergency.heatmap.status);
  const hasModel = useAppSelector((s: any) => !!s.emergency.floorplan.model);
  const routesSave = useAppSelector((s: any) => s.emergency.routesSave);

  const isHeatmapRunning = heatmapStatus === 'running';
  const isSaving = routesSave.status === 'saving';
  const justSaved = routesSave.status === 'saved';
  const saveError = routesSave.status === 'error' ? routesSave.error : null;

  const handleHeatmapToggle = () => {
    const nextVisible = !heatmapVisible;
    dispatch(toggleLayer('heatmap'));
    if (nextVisible && heatmapStatus === 'idle' && hasModel && !isHeatmapRunning) {
      dispatch(runEmergencyHeatmap({ resolutionMeters: 0.5, heightMeters: 0.8 }) as any);
    }
  };

  const handleSave = () => {
    if (!hasModel || isSaving) return;
    dispatch(saveEmergencyRoutes() as any);
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          onClick={handleHeatmapToggle}
          disabled={!hasModel || isHeatmapRunning}
          title="Toggle illuminance heatmap"
          style={{
            background: heatmapVisible
              ? 'rgba(56,189,248,0.15)'
              : 'rgba(56,189,248,0.05)',
            border: `1px solid ${heatmapVisible ? '#38BDF8' : '#334155'}`,
            color: heatmapVisible ? '#38BDF8' : '#64748B',
            padding: '4px 10px',
            borderRadius: 4,
            fontFamily: 'monospace',
            fontSize: 11,
            fontWeight: 'bold',
            cursor: isHeatmapRunning
              ? 'wait'
              : !hasModel
              ? 'not-allowed'
              : 'pointer',
            opacity: !hasModel ? 0.5 : 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {isHeatmapRunning
            ? '🔥 Computing…'
            : heatmapVisible
            ? '🔥 Heatmap ON'
            : '🔥 Heatmap'}
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={!hasModel || isSaving}
          title={saveError ? saveError : 'Save routes to floorplan document'}
          style={{
            background: justSaved
              ? 'rgba(16, 185, 129, 0.15)'
              : 'rgba(56, 189, 248, 0.10)',
            border: `1px solid ${saveError ? '#EF4444' : justSaved ? '#10B981' : '#38BDF8'}`,
            color: saveError ? '#EF4444' : justSaved ? '#10B981' : '#38BDF8',
            padding: '4px 10px',
            borderRadius: 4,
            fontFamily: 'monospace',
            fontSize: 11,
            fontWeight: 'bold',
            cursor: isSaving
              ? 'wait'
              : !hasModel
              ? 'not-allowed'
              : 'pointer',
            opacity: !hasModel ? 0.5 : 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {isSaving
            ? '💾 Saving…'
            : justSaved
            ? '✓ Saved'
            : saveError
            ? '⚠ Save'
            : '💾 Save'}
        </button>
      </div>
    </div>
  );
};

export default EmergencyToolbar;