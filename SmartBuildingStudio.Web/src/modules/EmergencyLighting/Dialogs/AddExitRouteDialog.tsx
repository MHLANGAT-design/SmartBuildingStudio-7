// src/modules/EmergencyLighting/Dialogs/AddExitRouteDialog.tsx

import React from 'react';

interface AddExitRouteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onBeginDraw: () => void;
}

export const AddExitRouteDialog: React.FC<AddExitRouteDialogProps> = ({
  isOpen,
  onClose,
  onBeginDraw,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#0F1424',
          border: '1px solid #1E293B',
          borderRadius: 8,
          padding: 24,
          width: 360,
          fontFamily: 'monospace',
          color: '#E2E8F0',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ color: '#38BDF8', fontSize: 14, margin: '0 0 12px' }}>
          Add Evacuation Route
        </h2>
        <p style={{ fontSize: 11, color: '#94A3B8', marginBottom: 16, lineHeight: 1.5 }}>
          Click two points on the canvas to define a route. We'll compute the
          straight-line distance automatically and validate it against the
          30m travel-distance limit.
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid #334155',
              color: '#94A3B8',
              padding: '6px 12px',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 11,
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onBeginDraw();
              onClose();
            }}
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid #10B981',
              color: '#10B981',
              padding: '6px 12px',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 'bold',
            }}
          >
            Begin Drawing
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddExitRouteDialog;