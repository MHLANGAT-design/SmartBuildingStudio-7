// src/modules/ProjectExplorer/Toolbar/Buttons/LaunchEmergencyButton.tsx
//
// Toolbar action that opens the Emergency Lighting module for the document
// currently selected in the ProjectExplorer tree.
//
// Enabled only when the selected node is a Document. Uses the same
// compact icon-button style as LaunchDaliDesignerButton.

import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@/Application/ConfigureStore";
import {
  selectSelectedNode,
  selectSelectedNodeId,
} from "@/modules/ProjectExplorer/Store/ProjectExplorerSelectors";

export const LaunchEmergencyButton: React.FC = () => {
  const navigate = useNavigate();

  const selectedNode = useAppSelector(selectSelectedNode);
  const selectedId = useAppSelector(selectSelectedNodeId);
  const activeProjectId = useAppSelector(
    (s: any) => s.projectExplorer?.activeProjectId ?? null
  );

  const isDocument = selectedNode?.type === "Document";
  const documentId = isDocument ? selectedId : null;
  const enabled = Boolean(activeProjectId && documentId);

  const handleAction = useCallback(() => {
    if (!activeProjectId || !documentId) return;
    navigate(`/designer?mode=emergency&projectId=${activeProjectId}&floorplanId=${documentId}`);
  }, [activeProjectId, documentId, navigate]);

  return (
    <button
      type="button"
      onClick={handleAction}
      disabled={!enabled}
      className={`flex items-center justify-center w-8 h-8 rounded transition-colors ${
        enabled
          ? "text-slate-300 hover:text-white hover:bg-slate-700"
          : "text-slate-600 cursor-not-allowed"
      }`}
      style={{ outline: "none" }}
      title={
        !isDocument
          ? "Select a document in the tree"
          : !activeProjectId
          ? "Open a project first"
          : "Open the Emergency Lighting module for this document"
      }
    >
      <span>🚨</span>
    </button>
  );
};

export default LaunchEmergencyButton;