// src/modules/FloorPlanDesigner/Components/DataDebugger.tsx
import React, { useState, useEffect } from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';

export const DataDebugger: React.FC = () => {
  const [show, setShow] = useState(false);
  const floorPlanState = useAppSelector((state: any) => state.floorPlan);
  const documentState = floorPlanState?.document || {};

  // Also read from global instance
  const globalInstance = (window as any).__floorPlanActiveDocumentInstance;

  // Get counts from Redux (if available)
  const reduxWalls = documentState.walls || [];
  const reduxDoors = documentState.doors || [];
  const reduxWindows = documentState.windows || [];
  const reduxRooms = documentState.rooms || [];
  const reduxDrawings = documentState.importedDrawings || [];

  // Get counts from global instance (if available)
  const instanceWalls = globalInstance?.getWalls?.() || [];
  const instanceDoors = globalInstance?.getDoors?.() || [];
  const instanceWindows = globalInstance?.getWindows?.() || [];
  const instanceRooms = globalInstance?.getRooms?.() || [];
  const instanceDrawings = globalInstance?.getImportedDrawings?.() || [];

  // Sample first wall if exists
  const firstWall = reduxWalls.length > 0 ? reduxWalls[0] : null;
  const firstInstanceWall = instanceWalls.length > 0 ? instanceWalls[0] : null;

  useEffect(() => {
    if (show) {
      console.log('[DataDebugger] 📊 Redux document state:', documentState);
      console.log('[DataDebugger] 📊 Global instance:', globalInstance);
    }
  }, [show, documentState, globalInstance]);

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 99999,
          backgroundColor: '#0F172A',
          border: '1px solid #05FFC4',
          color: '#05FFC4',
          padding: '8px 16px',
          borderRadius: 8,
          cursor: 'pointer',
          fontFamily: 'monospace',
          fontSize: 12,
        }}
      >
        🐞 Debug Data
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 70,
        right: 20,
        zIndex: 99999,
        backgroundColor: '#0B0F19',
        border: '1px solid #1E293B',
        borderRadius: 12,
        padding: 16,
        maxWidth: 500,
        maxHeight: '80vh',
        overflow: 'auto',
        color: '#E2E8F0',
        fontFamily: 'monospace',
        fontSize: 12,
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.75)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#38BDF8', fontWeight: 'bold' }}>🔍 Deserialization Debugger</span>
        <button
          onClick={() => setShow(false)}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            fontSize: 18,
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ borderTop: '1px solid #1E293B', paddingTop: 8 }}>
        <div><span style={{ color: '#64748B' }}>Redux Document ID:</span> {documentState.id || '❌ Not set'}</div>
        <div><span style={{ color: '#64748B' }}>Global Instance ID:</span> {globalInstance?.getId?.() || '❌ Not set'}</div>
      </div>

      <div style={{ borderTop: '1px solid #1E293B', paddingTop: 8 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div><span style={{ color: '#64748B' }}>🧱 Walls (Redux):</span> {reduxWalls.length}</div>
          <div><span style={{ color: '#64748B' }}>🧱 Walls (Instance):</span> {instanceWalls.length}</div>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div><span style={{ color: '#64748B' }}>🚪 Doors (Redux):</span> {reduxDoors.length}</div>
          <div><span style={{ color: '#64748B' }}>🚪 Doors (Instance):</span> {instanceDoors.length}</div>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div><span style={{ color: '#64748B' }}>🪟 Windows (Redux):</span> {reduxWindows.length}</div>
          <div><span style={{ color: '#64748B' }}>🪟 Windows (Instance):</span> {instanceWindows.length}</div>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div><span style={{ color: '#64748B' }}>🛋️ Rooms (Redux):</span> {reduxRooms.length}</div>
          <div><span style={{ color: '#64748B' }}>🛋️ Rooms (Instance):</span> {instanceRooms.length}</div>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div><span style={{ color: '#64748B' }}>📄 Imported Drawings (Redux):</span> {reduxDrawings.length}</div>
          <div><span style={{ color: '#64748B' }}>📄 Imported Drawings (Instance):</span> {instanceDrawings.length}</div>
        </div>
      </div>

      {firstWall && (
        <div style={{ borderTop: '1px solid #1E293B', paddingTop: 8 }}>
          <div style={{ color: '#64748B' }}>Sample Wall (Redux):</div>
          <pre style={{ margin: 0, background: '#0F172A', padding: 8, borderRadius: 4, overflow: 'auto', maxHeight: 100 }}>
            {JSON.stringify(firstWall, null, 2)}
          </pre>
        </div>
      )}

      {firstInstanceWall && (
        <div style={{ borderTop: '1px solid #1E293B', paddingTop: 8 }}>
          <div style={{ color: '#64748B' }}>Sample Wall (Instance):</div>
          <pre style={{ margin: 0, background: '#0F172A', padding: 8, borderRadius: 4, overflow: 'auto', maxHeight: 100 }}>
            {JSON.stringify(firstInstanceWall, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ borderTop: '1px solid #1E293B', paddingTop: 8, fontSize: 10, color: '#475569' }}>
        🧪 If counts &gt; 0, deserialization is working. If canvas is blank, it's a viewport issue.
      </div>
    </div>
  );
};

export default DataDebugger;