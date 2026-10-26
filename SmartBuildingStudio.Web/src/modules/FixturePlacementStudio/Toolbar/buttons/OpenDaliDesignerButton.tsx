// src/modules/FixturePlacementStudio/Toolbar/buttons/OpenDaliDesignerButton.tsx
//
// Opens the DALI Designer for the currently-loaded fixture document.
//
// Reads projectId + documentId from Redux:
//   - documentId: state.fixture.documentId  (set by loadSucceeded)
//   - projectId:  state.fixture.activationContext?.projectId
//                 ?? state.projectExplorer.activeProjectId
//
// No DALI internals are imported — only the deep-link URL is constructed.
// The DALI module boots on the other side.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/Application/ConfigureStore';

export const OpenDaliDesignerButton: React.FC = () => {
  const navigate = useNavigate();

  const documentId = useAppSelector(
    (s: any) => s.fixture?.documentId ?? null
  );

  // Prefer the activation context's projectId (it travels with the doc),
  // fall back to the ProjectExplorer's active project.
  const projectId = useAppSelector(
    (s: any) =>
      s.fixture?.activationContext?.projectId ??
      s.projectExplorer?.activeProjectId ??
      null
  );

  const disabled = !projectId || !documentId;

  const tooltip = !documentId
    ? 'No fixture document loaded'
    : !projectId
    ? 'No active project — open one in ProjectExplorer first'
    : 'Open the DALI Designer for this floorplan';

  const handleClick = () => {
    if (!projectId || !documentId) return;
    navigate(`/projects/${projectId}/floorplans/${documentId}/dali`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title={tooltip}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 4,
        border: `1px solid ${disabled ? '#1E293B' : '#8B5CF6'}`,
        background: disabled
          ? 'rgba(30, 41, 59, 0.4)'
          : 'rgba(139, 92, 246, 0.12)',
        color: disabled ? '#64748B' : '#C4B5FD',
        fontSize: 11,
        fontFamily: 'monospace',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.1s, border-color 0.1s, color 0.1s',
      }}
    >
      ⚡ DALI Designer
    </button>
  );
};

export default OpenDaliDesignerButton;