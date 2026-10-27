// src/modules/FloorPlanDesigner/Components/WorkspaceHeaderBreadcrumbs.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';

export const WorkspaceHeaderBreadcrumbs: React.FC = () => {
  const floorPlanState = useAppSelector((state: any) => state?.floorPlan);
  const activeDocument = useAppSelector((state: any) => state?.floorPlan?.document);
  const projectState = useAppSelector((state: any) => state?.projectExplorer);

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

  // ── Counts (Walls, Doors, Windows, Rooms) ───────────────────────────
  const metrics = useMemo(() => {
    const doc = activeDocument || {};
    
    // Fallback: if the semantic arrays are empty, count directly from elements.
    const elements: any[] = Array.isArray(doc.elements) ? doc.elements : [];
    
    let walls = 0, doors = 0, windows = 0, rooms = 0;

    for (const el of elements) {
      const type = String(el.type || '').toLowerCase();
      const layer = String(el.layer || el.originalLayer || '').toLowerCase();
      
      if (type === 'room' || el.isRoom === true || layer === 'rooms') {
        rooms++;
      } else if (type.includes('door') || layer.includes('door') || layer === 'dr') {
        doors++;
      } else if (type.includes('window') || layer.includes('window') || layer.includes('glaz')) {
        windows++;
      } else if (type.includes('wall') || type === 'polyline' || layer.includes('wall') || el.thickness !== undefined) {
        walls++;
      }
    }

    return {
      wCount: doc.walls?.length || walls,
      dCount: doc.doors?.length || doors,
      winCount: doc.windows?.length || windows,
      rCount: doc.rooms?.length || rooms,
    };
  }, [activeDocument]);

  // ── Breadcrumb labels ───────────────────────────────────────────────
  const getBreadcrumbData = useCallback(() => {
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

    const docInfo = activeDocument || floorPlanState?.document || projectState?.activeDocument || {};
    const project =
      docInfo.activeProjectName || docInfo.projectName || docInfo.project?.name || floorPlanState?.activeProjectName || 'Unknown Project';
    const building =
      docInfo.activeBuildingName || docInfo.buildingName || docInfo.building?.name || floorPlanState?.activeBuildingName || 'Unknown Building';
    const floor =
      docInfo.activeFloorName || docInfo.floorName || docInfo.floor?.name || floorPlanState?.activeFloorName || 'Unknown Floor';
    const document =
      docInfo.activeDocumentName || docInfo.name || docInfo.documentName || docInfo.title || floorPlanState?.activeDocumentName || (window as any).__floorPlanActiveDocumentInstance?.activeDocumentName || 'Untitled Layout';

    return { project, building, floor, document };
  }, [activeDocument, floorPlanState, projectState]);

  const updateBreadcrumbs = useCallback(() => {
    const data = getBreadcrumbData();
    setBreadcrumbData(data);
  }, [getBreadcrumbData]);

  useEffect(() => {
    updateBreadcrumbs();
    const handleContextUpdate = () => updateBreadcrumbs();
    window.addEventListener('sbs:context-updated', handleContextUpdate);
    window.addEventListener('sbs:canvas-update', handleContextUpdate);
    window.addEventListener('sbs:document-opened', handleContextUpdate);
    return () => {
      window.removeEventListener('sbs:context-updated', handleContextUpdate);
      window.removeEventListener('sbs:canvas-update', handleContextUpdate);
      window.removeEventListener('sbs:document-opened', handleContextUpdate);
    };
  }, [updateBreadcrumbs]);

  useEffect(() => {
    updateBreadcrumbs();
  }, [activeDocument, floorPlanState, projectState, updateBreadcrumbs]);

  const { project, building, floor, document } = breadcrumbData;

  return (
    <div className="flex items-center justify-between h-10 px-4 bg-[#0F1424] border-b border-[#1E293B] font-mono text-xs select-none">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center space-x-2 text-slate-400">
        <span className="text-sky-400 font-semibold truncate max-w-[140px]" title={project}>🏢 {project}</span>
        <span className="text-slate-600 font-sans">/</span>
        <span className="text-slate-300 font-medium truncate max-w-[140px]" title={building}>🏬 {building}</span>
        <span className="text-slate-600 font-sans">/</span>
        <span className="text-slate-400 truncate max-w-[140px]" title={floor}>🥞 {floor}</span>
        <span className="text-slate-600 font-sans">/</span>
        <span className="text-sky-200 font-bold truncate max-w-[180px] bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20" title={document}>📄 {document}</span>
      </div>

      {/* Right: Element Counts */}
      <div className="flex items-center gap-4 text-[10px] text-slate-500">
        <div className="flex items-center gap-1.5"><span>W:</span><b className="text-slate-200">{metrics.wCount}</b></div>
        <div className="flex items-center gap-1.5"><span>D:</span><b className="text-slate-200">{metrics.dCount}</b></div>
        <div className="flex items-center gap-1.5"><span>WIN:</span><b className="text-slate-200">{metrics.winCount}</b></div>
        <div className="flex items-center gap-1.5"><span>RM:</span><b className="text-slate-200">{metrics.rCount}</b></div>
      </div>
    </div>
  );
};

export default WorkspaceHeaderBreadcrumbs;