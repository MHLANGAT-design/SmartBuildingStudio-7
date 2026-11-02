// src/modules/ProjectExplorer/Sidebar/DocumentActionsPanel.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Layers, Lightbulb, Zap, FilePlus, AlertTriangle, Cpu } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/Application/ConfigureStore";
import {
  selectSelectedNode,
} from "@/modules/ProjectExplorer/Store/ProjectExplorerSelectors";
import { setDocumentMetadata } from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";
import { resetProgrammingState } from "@/modules/DaliProgrammingStudio/store/programmingSlice";
import { resetDaliDocument } from "@/modules/DaliDesigner/store/daliSlice";

type Mode = "floorplans" | "fixtures" | "dali" | "emergency" | "programming" | "import";

interface ActionTile {
  mode: Mode;
  label: string;
  hint: string;
  icon: React.ReactNode;
  accent: string;
}

const TILES: ActionTile[] = [
  {
    mode: "floorplans",
    label: "Floor Plan Designer",
    hint: "Edit walls, doors, windows, rooms",
    icon: <Layers size={18} />,
    accent: "#05FFC4",
  },
  {
    mode: "fixtures",
    label: "Fixture Placement Studio",
    hint: "Place fixtures and compute illuminance",
    icon: <Lightbulb size={18} />,
    accent: "#F59E0B",
  },
  {
    mode: "dali",
    label: "DALI Designer",
    hint: "Commission addresses, groups, scenes",
    icon: <Zap size={18} />,
    accent: "#8B5CF6",
  },
  {
    mode: "programming",
    label: "DALI Programming",
    hint: "Compile and deploy the approved DALI design",
    icon: <Cpu size={18} />,
    accent: "#22C55E", // Green to distinguish from DALI Designer
  },
  {
    mode: "emergency",
    label: "Emergency Lighting",
    hint: "Run compliance simulation and export safety reports",
    icon: <AlertTriangle size={18} />,
    accent: "#F43F5E",
  },
  {
    mode: "import",
    label: "Import Fresh DWG",
    hint: "Flush state and load a fresh DWG",
    icon: <FilePlus size={18} />,
    accent: "#F59E0B",
  },
];

/**
 * Walk the ancestor chain from a node upward. Returns the first
 * ancestor of each type, or null when the chain is broken.
 */
function resolveAncestors(node: any, nodes: any[]) {
  const byId = new Map(nodes.map((n) => [String(n.id), n]));
  const ancestors = {
    project: null as any,
    building: null as any,
    floor: null as any,
  };
  let current = node;
  let safety = 0;
  while (current && safety < 20) {
    const parent = current.parentId
      ? byId.get(String(current.parentId))
      : null;
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

  // Resolve the ancestor chain from the tree.
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

    // 1. Dispatch metadata so the store's floorPlan.document slice
    //    holds the correct names and context before navigating.
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
        walls: [],
        doors: [],
        windows: [],
        rooms: [],
        importedDrawings: [],
        electricalFixtures: [],
      })
    );

    // 2. Expose the same context on window for peripheral integrations
    (window as any).__activeDocumentId = String(documentId);
    (window as any).__designerMode = mode;
    (window as any).__activeDocumentContext = {
      projectId,
      buildingId,
      floorId,
      projectName,
      buildingName,
      floorName,
      documentName,
      level: 0,
    };

    // 3. Navigate to the chosen studio.
    if (mode === "dali") {
      if (!projectId) {
        console.warn("[DocumentActionsPanel] Cannot open DALI: missing projectId");
        return;
      }
      dispatch(resetDaliDocument()); // Clear stale state
      navigate(`/projects/${projectId}/floorplans/${documentId}/dali`);
      return;
    }

    if (mode === "programming") {
      if (!projectId) {
        console.warn("[DocumentActionsPanel] Cannot open Programming: missing projectId");
        return;
      }
      dispatch(resetDaliDocument()); // Clear stale DALI state
      dispatch(resetProgrammingState()); // Clear stale Programming state
      navigate(`/projects/${projectId}/floorplans/${documentId}/programming`);
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
        <div className="document-actions-context">
          {buildingName} • {floorName}
        </div>
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