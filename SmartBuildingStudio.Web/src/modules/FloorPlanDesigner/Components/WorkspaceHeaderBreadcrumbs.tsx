// src/modules/FloorPlanDesigner/Components/WorkspaceHeaderBreadcrumbs.tsx
// COMPLETE FILE – Single source of truth from global context

import React, { useState, useEffect, useCallback } from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';

export const WorkspaceHeaderBreadcrumbs: React.FC = () => {
  // Get Redux state as fallback
  const floorPlanState = useAppSelector((state: any) => state?.floorPlan);
  const activeDocument = useAppSelector((state: any) => state?.floorPlan?.document);
  const projectState = useAppSelector((state: any) => state?.projectExplorer);

  // Local state for breadcrumb data to force re-render on context changes
  const [breadcrumbData, setBreadcrumbData] = useState<{
    project: string;
    building: string;
    floor: string;
    document: string;
  }>({
    project: 'Unknown Project',
    building: 'Unknown Building',
    floor: 'Unknown Floor',
    document: 'Untitled Layout',
  });

  // Function to extract breadcrumb data from the current context
  const getBreadcrumbData = useCallback(() => {
    // 1. Primary source: global context set during navigation/creation
    const globalContext = (window as any).__activeDocumentContext;
    const globalDocId = (window as any).__activeDocumentId;

    if (globalContext && globalContext.documentName) {
      return {
        project: globalContext.projectName || 'Unknown Project',
        building: globalContext.buildingName || 'Unknown Building',
        floor: globalContext.floorName || 'Unknown Floor',
        document: globalContext.documentName || globalDocId || 'Untitled Layout',
      };
    }

    // 2. Fallback: Redux state
    const docInfo = activeDocument || floorPlanState?.document || projectState?.activeDocument || {};
    const project =
      docInfo.activeProjectName ||
      docInfo.projectName ||
      docInfo.project?.name ||
      floorPlanState?.activeProjectName ||
      'Unknown Project';
    const building =
      docInfo.activeBuildingName ||
      docInfo.buildingName ||
      docInfo.building?.name ||
      floorPlanState?.activeBuildingName ||
      'Unknown Building';
    const floor =
      docInfo.activeFloorName ||
      docInfo.floorName ||
      docInfo.floor?.name ||
      floorPlanState?.activeFloorName ||
      'Unknown Floor';
    const document =
      docInfo.activeDocumentName ||
      docInfo.name ||
      docInfo.documentName ||
      docInfo.title ||
      floorPlanState?.activeDocumentName ||
      (window as any).__floorPlanActiveDocumentInstance?.activeDocumentName ||
      'Untitled Layout';

    return { project, building, floor, document };
  }, [activeDocument, floorPlanState, projectState]);

  // Update breadcrumb data whenever context changes
  const updateBreadcrumbs = useCallback(() => {
    const data = getBreadcrumbData();
    setBreadcrumbData(data);
  }, [getBreadcrumbData]);

  // Listen to context changes and update
  useEffect(() => {
    // Initial update
    updateBreadcrumbs();

    // Listen to custom events that indicate context changes
    const handleContextUpdate = () => updateBreadcrumbs();
    window.addEventListener('sbs:context-updated', handleContextUpdate);
    window.addEventListener('sbs:canvas-update', handleContextUpdate);
    window.addEventListener('sbs:document-opened', handleContextUpdate);

    // Also listen to Redux changes via a timer? No, we rely on events.
    // But we also need to re-run when the Redux state changes (e.g., after fetch).
    // We'll use a useEffect with dependencies to trigger on Redux changes.
    return () => {
      window.removeEventListener('sbs:context-updated', handleContextUpdate);
      window.removeEventListener('sbs:canvas-update', handleContextUpdate);
      window.removeEventListener('sbs:document-opened', handleContextUpdate);
    };
  }, [updateBreadcrumbs]);

  // Also update when Redux state changes (to catch fetches)
  useEffect(() => {
    updateBreadcrumbs();
  }, [activeDocument, floorPlanState, projectState, updateBreadcrumbs]);

  // If no data yet, show loading
  if (!breadcrumbData.document && !breadcrumbData.project) {
    return (
      <div className="flex items-center h-10 px-4 bg-[#0F1424] border-b border-[#1E293B] text-slate-500 text-xs font-medium tracking-wide">
        <span>⏳ No Document Active - Initializing Session...</span>
      </div>
    );
  }

  const { project, building, floor, document } = breadcrumbData;

  return (
    <div className="flex items-center h-10 px-4 bg-[#0F1424] border-b border-[#1E293B] font-mono text-xs select-none">
      <div className="flex items-center space-x-2 text-slate-400">
        {/* Project */}
        <span
          className="text-sky-400 font-semibold truncate max-w-[140px] cursor-pointer hover:text-sky-300 transition-colors"
          title={`Project: ${project}`}
          onClick={() => console.log('[Breadcrumbs] Project clicked:', project)}
        >
          🏢 {project}
        </span>
        <span className="text-slate-600 font-sans">/</span>

        {/* Building */}
        <span
          className="text-slate-300 font-medium truncate max-w-[140px] cursor-pointer hover:text-slate-200 transition-colors"
          title={`Building: ${building}`}
          onClick={() => console.log('[Breadcrumbs] Building clicked:', building)}
        >
          🏬 {building}
        </span>
        <span className="text-slate-600 font-sans">/</span>

        {/* Floor */}
        <span
          className="text-slate-400 truncate max-w-[140px] cursor-pointer hover:text-slate-300 transition-colors"
          title={`Floor: ${floor}`}
          onClick={() => console.log('[Breadcrumbs] Floor clicked:', floor)}
        >
          🥞 {floor}
        </span>
        <span className="text-slate-600 font-sans">/</span>

        {/* Document */}
        <span
          className="text-sky-200 font-bold truncate max-w-[180px] bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20 cursor-pointer hover:bg-sky-500/20 transition-colors"
          title={`Document: ${document}`}
          onClick={() => console.log('[Breadcrumbs] Document clicked:', document)}
        >
          📄 {document}
        </span>
      </div>
    </div>
  );
};

export default WorkspaceHeaderBreadcrumbs;