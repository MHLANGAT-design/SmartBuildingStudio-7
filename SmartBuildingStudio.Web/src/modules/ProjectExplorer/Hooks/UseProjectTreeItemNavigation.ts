// src/modules/ProjectExplorer/Hooks/UseProjectTreeItemNavigation.ts

import { useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppDispatch } from "@/Application/ConfigureStore";
import { ExplorerNode } from "../Models/ExplorerNode";
import { setDocumentMetadata } from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";
import { UseProjectTreeItemContext } from "./UseProjectTreeItemContext";

export type DesignMode =
  | "floorplans"
  | "import"
  | "fixtures"
  | "dali"
  | "programming"
  | "commissioning"
  | "discovery"
  | "gateways";   // NEW

export function UseProjectTreeItemNavigation() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getDocumentContext } = UseProjectTreeItemContext();

  const intent = searchParams.get("intent");

  const executeMode = useCallback(
    (documentId: string, context: any, docName: string, mode: DesignMode) => {
      let resolvedFloorLevel = 0;
      if (context.level !== undefined) resolvedFloorLevel = Number(context.level);
      else if (context.floorLevel !== undefined) resolvedFloorLevel = Number(context.floorLevel);
      else if (context.floorName?.toLowerCase().includes("lvl 1")) resolvedFloorLevel = 1;
      else if (context.floorName?.toLowerCase().includes("lvl 2")) resolvedFloorLevel = 2;
      else if (context.floorName?.toLowerCase().includes("level 1")) resolvedFloorLevel = 1;
      else if (context.floorName?.toLowerCase().includes("level 2")) resolvedFloorLevel = 2;

      dispatch(
        setDocumentMetadata({
          id: String(documentId),
          name: docName,
          nodeType: "Document",
          nodeParentId: null,
          buildingId: context.buildingId || null,
          floorId: context.floorId || null,
          projectId: context.projectId || null,
          activeProjectName: context.projectName || "Unknown Project",
          activeBuildingName: context.buildingName || "Unknown Building",
          activeFloorName: context.floorName || "Unknown Floor",
          activeDocumentName: docName,
          level: resolvedFloorLevel,
          walls: [], doors: [], windows: [], rooms: [],
          importedDrawings: [], electricalFixtures: [],
        })
      );

      (window as any).__activeDocumentId = String(documentId);
      (window as any).__designerMode = mode;
      (window as any).__activeDocumentContext = {
        ...context,
        projectId: context.projectId,
        buildingId: context.buildingId,
        floorId: context.floorId,
        projectName: context.projectName || "Unknown Project",
        buildingName: context.buildingName || "Unknown Building",
        floorName: context.floorName || "Unknown Floor",
        documentName: docName,
        level: resolvedFloorLevel,
      };

      // ── DALI Designer ─────────
      if (mode === "dali") {
        const projectId = context.projectId;
        if (!projectId) return;
        navigate(`/projects/${projectId}/floorplans/${documentId}/dali`);
        return;
      }

      // ── DALI Programming ──────
      if (mode === "programming") {
        const projectId = context.projectId;
        if (!projectId) return;
        navigate(`/projects/${projectId}/floorplans/${documentId}/programming`);
        return;
      }

      // ── Commissioning ─────────
      if (mode === "commissioning") {
        const projectId = context.projectId;
        if (!projectId) return;
        navigate(`/projects/${projectId}/floorplans/${documentId}/commissioning`);
        return;
      }

      // ── Device Discovery ──────
      if (mode === "discovery") {
        const projectId = context.projectId;
        if (!projectId) return;
        navigate(`/projects/${projectId}/floorplans/${documentId}/discovery`);
        return;
      }

      // ── Gateway Management ─────  NEW
      // Gateways are assigned to projects (not to a single floorplan), so
      // the destination is project-scoped. The document id is passed in
      // the query string so the page can default to that building/floor
      // when creating a new gateway assignment.
      if (mode === "gateways") {
        const projectId = context.projectId;
        if (!projectId) return;
        const params = new URLSearchParams({
          buildingId: context.buildingId || "",
          floorId: context.floorId || "",
          documentId: String(documentId),
        });
        navigate(`/projects/${projectId}/gateways?${params.toString()}`);
        return;
      }

      // ── FPD, FPS, Import ──────────────
      const urlMode =
        mode === "import" ? "floorplans" :
        mode === "fixtures" ? "fixtures" :
        "floorplans";

      const params = new URLSearchParams({
        documentId: String(documentId),
        mode: urlMode,
        projectId: context.projectId || "",
        buildingId: context.buildingId || "",
        floorId: context.floorId || "",
        revision: "0",
      });

      if (mode === "import") params.set("action", "import-dwg");

      navigate(`/designer?${params.toString()}`);
    },
    [dispatch, navigate]
  );

  const handleDocumentClick = useCallback(
    (targetNode: ExplorerNode) => {
      const documentId =
        targetNode.id ??
        (targetNode as any).Id ??
        (targetNode as any).guid ??
        (targetNode as any).Guid;
      if (!documentId) return;

      const context = getDocumentContext(targetNode);
      const docName =
        targetNode.name ?? (targetNode as any).Name ?? "Untitled Document";

      if (intent === "fixtures") {
        executeMode(String(documentId), context, docName, "fixtures");
        return;
      }

      if (intent === "dali") {
        executeMode(String(documentId), context, docName, "dali");
        return;
      }

      if (intent === "programming") {
        executeMode(String(documentId), context, docName, "programming");
        return;
      }

      if (intent === "commissioning") {
        executeMode(String(documentId), context, docName, "commissioning");
        return;
      }

      if (intent === "discovery") {
        executeMode(String(documentId), context, docName, "discovery");
        return;
      }

      if (intent === "gateways") {                          // NEW
        executeMode(String(documentId), context, docName, "gateways");
        return;
      }

      dispatch({
        type: "projectExplorer/selectNode",
        payload: String(documentId),
      });
    },
    [getDocumentContext, intent, executeMode, dispatch]
  );

  return { handleDocumentClick, intent };
}