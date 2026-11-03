// src/modules/ProjectExplorer/Sidebar/DocumentActionsPanel.tsx

import React from "react";
import { useNavigate } from "react-router-dom";
import { Layers, Lightbulb, Zap, FilePlus, AlertTriangle, Cpu, Wrench } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/Application/ConfigureStore";
import {
  selectSelectedNode,
} from "@/modules/ProjectExplorer/Store/ProjectExplorerSelectors";
import { setDocumentMetadata } from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";
import { resetProgrammingState } from "@/modules/DaliProgrammingStudio/store/programmingSlice";
import { resetDaliDocument } from "@/modules/DaliDesigner/store/daliSlice";

type Mode = "floorplans" | "fixtures" | "dali" | "emergency" | "programming" | "commissioning" | "import";

interface ActionTile {
  mode: Mode;
  label: string;
  hint: string;
  icon: React.ReactNode;
  accent: string;
}

const TILES: ActionTile[] = [
  { mode: "floorplans", label: "Floor Plan Designer", hint: "Edit walls, doors, windows, rooms", icon: <Layers size={18} />, accent: "#05FFC4" },
  { mode: "fixtures", label: "Fixture Placement Studio", hint: "Place fixtures and compute illuminance", icon: <Lightbulb size={18} />, accent: "#F59E0B" },
  { mode: "dali", label: "DALI Designer", hint: "Commission addresses, groups, scenes", icon: <Zap size={18} />, accent: "#8B5CF6" },
  { mode: "programming", label: "DALI Programming", hint: "Compile and deploy the approved DALI design", icon: <Cpu size={18} />, accent: "#22C55E" },
  { mode: "commissioning", label: "Commissioning", hint: "Test physical devices and generate report", icon: <Wrench size={18} />, accent: "#14B8A6" },
  { mode: "emergency", label: "Emergency Lighting", hint: "Run compliance simulation and export safety reports", icon: <AlertTriangle size={18} />, accent: "#F43F5E" },
  { mode: "import", label: "Import Fresh DWG", hint: "Flush state and load a fresh DWG", icon: <FilePlus size={18} />, accent: "#F59E0B" },
];

function resolveAncestors(node: any, nodes: any[]) {
  const byId = new Map(nodes.map((n) => [String(n.id), n]));
  const ancestors = { project: null as any, building: null as any, floor: null as any };
  let current = node;
  let safety = 0;
  while (current && safety < 20) {
    const parent = current.parentId ? byId.get(String(current.parentId)) : null;
    if (!parent) break;
    if (parent.type === "Project") ancestors.project = parent;
    else if (parent.type === "Building") ancestors.building = parent;
    else if (parent.type === "Floor") ancestors.floor = parent;
    current = parent;
    safety++;
  }
  return ancestors;
}

export function DocumentActionsPanel() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const selectedNode = useAppSelector(selectSelectedNode);
  const nodes = useAppSelector((s: any) => s.projectExplorer?.nodes ?? []);

  const isDocument = selectedNode?.type === "Document";
  const documentId = isDocument ? selectedNode?.id : null;

  if (!isDocument || !selectedNode) {
    return (
      <div className="document-actions-panel document-actions-empty">
        <p>Select a document to see available actions.</p>
      </div>
    );
  }

  const ancestors = resolveAncestors(selectedNode, nodes);
  const projectId = ancestors.project?.id ?? null;
  const buildingId = ancestors.building?.id ?? null;
  const floorId = ancestors.floor?.id ?? null;
  const projectName = ancestors.project?.name ?? "Unknown Project";
  const buildingName = ancestors.building?.name ?? "Unknown Building";
  const floorName = ancestors.floor?.name ?? "Unknown Floor";
  const documentName = selectedNode.name ?? "Untitled";

  const handleSelect = (mode: Mode) => {
    if (!documentId) return;

    dispatch(
      setDocumentMetadata({
        id: String(documentId),
        name: documentName,
        nodeType: "Document",
        nodeParentId: null,
        buildingId,
        floorId,
        projectId,
        activeProjectName: projectName,
        activeBuildingName: buildingName,
        activeFloorName: floorName,
        activeDocumentName: documentName,
        level: 0,
        walls: [], doors: [], windows: [], rooms: [],
        importedDrawings: [], electricalFixtures: [],
      })
    );

    (window as any).__activeDocumentId = String(documentId);
    (window as any).__designerMode = mode;
    (window as any).__activeDocumentContext = {
      projectId, buildingId, floorId, projectName, buildingName, floorName, documentName, level: 0,
    };

    if (mode === "dali") {
      if (!projectId) return;
      dispatch(resetDaliDocument());
      navigate(`/projects/${projectId}/floorplans/${documentId}/dali`);
      return;
    }

    if (mode === "programming") {
      if (!projectId) return;
      dispatch(resetDaliDocument());
      dispatch(resetProgrammingState());
      navigate(`/projects/${projectId}/floorplans/${documentId}/programming`);
      return;
    }

    if (mode === "commissioning") {
      if (!projectId) return;
      navigate(`/projects/${projectId}/floorplans/${documentId}/commissioning`);
      return;
    }

    const urlMode =
      mode === "import" ? "floorplans" :
      mode === "fixtures" ? "fixtures" :
      mode === "emergency" ? "emergency" :
      "floorplans";

    const params = new URLSearchParams({
      documentId: String(documentId),
      mode: urlMode,
      projectId: projectId ?? "",
      buildingId: buildingId ?? "",
      floorId: floorId ?? "",
      projectName: projectName,
      buildingName: buildingName,
      floorName: floorName,
      revision: "0",
    });
    if (mode === "import") params.set("action", "import-dwg");

    navigate(`/designer?${params.toString()}`);
  };

  return (
    <div className="document-actions-panel">
      <div className="document-actions-header">
        <div className="document-actions-name">{documentName}</div>
        <div className="document-actions-context">{buildingName} • {floorName}</div>
      </div>

      <div className="document-actions-tiles">
        {TILES.map((tile) => (
          <button
            key={tile.mode}
            className="document-actions-tile"
            onClick={() => handleSelect(tile.mode)}
            title={tile.hint}
            style={{ ["--tile-accent" as any]: tile.accent }}
          >
            <span className="document-actions-icon">{tile.icon}</span>
            <span className="document-actions-body">
              <span className="document-actions-label">{tile.label}</span>
              <span className="document-actions-hint">{tile.hint}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default DocumentActionsPanel;