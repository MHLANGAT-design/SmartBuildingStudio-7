// src/modules/FloorPlanDesigner/Hooks/UseDxfImport.ts
//
// DXF import hook. Single entry point for uploads to
// /api/v1/floorplan-designer/import — the DxfFloorPlanController →
// ImportFloorPlanCommandHandler → app.py classifier pipeline.
//
// Document identity is preserved across import. ProjectExplorer is the
// source of truth: the URL's ?documentId= param is what the tree set
// when the user selected a node.
//
// Grouping:
//   Doors and windows are grouped by their shared group_id (from the
//   DXF block INSERT handle in app.py) so N segments collapse into one
//   DoorData / WindowData semantic record for the inspector.
//
//   Walls are grouped geometrically (groupWallSegments) because
//   app.py emits them as direct modelspace LINE entities with no
//   group_id. Collinear segments sharing an endpoint are joined into
//   one physical wall.
//
//   For the render path, the same groups are collapsed into composite
//   elements — one per physical door / window / wall — that carry the
//   raw primitives the renderer draws. The raw per-polyline elements
//   never enter document.elements; only the composite representations
//   do. This is what takes a 21k-element plan down to ~800 elements
//   and drops the persisted DrawnWallsJson payload from ~10 MB to
//   ~500 KB.
//
//   Rooms and fixtures stay discrete — their semantic records are
//   already one-per-object and small, so no composite wrapping is
//   needed.
//
//   WALL ID UNIQUENESS: closed-loop wall chains (shafts, columns,
//   hollow wall outlines) produce multiple collinear groups that share
//   the same source DXF entity id. `buildWall` cannot detect this
//   collision on its own (it sees one group at a time). This hook is
//   responsible for making the resulting ids unique — see the
//   `usedWallIds` set below. Without it, the semantic walls array
//   contains duplicate ids and DrawingDocument.loadFromState throws
//   ("[Wall] Entity 'E61' already exists").

import { useCallback, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/Application/ConfigureStore";
import {
  setDocument,
  markDirty,
} from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";
import { uploadDxfFile } from "@/modules/FloorPlanDesigner/Services/api";
import {
  buildWall,
  buildDoor,
  buildWindow,
  buildRoom,
  getElementType,
  groupElementsByKey,
  groupWallSegments,
} from "@/modules/FloorPlanDesigner/core/parsers/DxfResponseBuilders";
import {
  composeDoorFromGroup,
  composeWindowFromGroup,
  composeWallFromGroup,
  type CompositeElement,
} from "@/modules/FloorPlanDesigner/core/composite/ElementComposer";
import { DoorData } from "@/modules/FloorPlanDesigner/core/types/Door.types";

export interface UseDxfImportReturn {
  fileInputRef: React.RefObject<HTMLInputElement>;
  importing: boolean;
  error: string | null;
  triggerFilePicker: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  clearError: () => void;
}

/**
 * Pick a unique id derived from `baseId`. If `baseId` is not in `used`,
 * returns it as-is and records it. If it is, tries `baseId-2`,
 * `baseId-3`, ... until it finds one that's free. Records whichever
 * variant was chosen.
 *
 * Not exported — internal helper for the import path.
 */
function uniquifyId(baseId: string, used: Set<string>): string {
  if (!used.has(baseId)) {
    used.add(baseId);
    return baseId;
  }
  let n = 2;
  while (used.has(`${baseId}-${n}`)) n++;
  const variant = `${baseId}-${n}`;
  used.add(variant);
  return variant;
}

export function UseDxfImport(): UseDxfImportReturn {
  const dispatch = useAppDispatch();
  const currentDocument = useAppSelector((s: any) => s.floorPlan?.document);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const uploadedFile = e.target.files?.[0];
      if (!uploadedFile) return;

      setImporting(true);
      setError(null);

      try {
        const plan = await uploadDxfFile(uploadedFile);
        const importedElements = plan.elements || (plan as any).Elements || [];

        const normalizedElements = importedElements.map((el: any) => {
          const pts = (el.points || el.Points || []).map((p: any) => ({
            x: p.x !== undefined ? p.x : p.X ?? 0,
            y: p.y !== undefined ? p.y : p.Y ?? 0,
          }));
          return {
            ...el,
            points: pts,
            groupId: el.groupId ?? el.GroupId ?? undefined,
          };
        });

        // ── Walls — geometric grouping + semantic + composite ─────
        //
        // app.py does not group walls (they're direct modelspace
        // LINEs with no INSERT handle). Group by collinear-chain
        // walk so each physical wall's segments become one group,
        // one semantic record, and one composite.
        //
        // Closed-loop chains (shafts, columns) produce multiple
        // collinear groups that share one source DXF id. Walk the
        // groups in order and uniquify the id of each one — the
        // first group keeps its base id, subsequent groups get
        // `-2`, `-3`, ... suffixes. The same suffix is applied to
        // the composite wall's id so semantic and composite stay
        // paired.
        const wallElements = normalizedElements.filter(
          (el) => getElementType(el) === "wall"
        );
        const wallGroups = groupWallSegments(wallElements, {
          tol: 50,
          angleTol: 0.02,
        });

        const usedWallIds = new Set<string>();
        const walls = wallGroups.map((g, i) => {
          // First pass: build without a suffix to learn the base id.
          const probe = buildWall(g, i);
          const baseId = String(probe.id);

          // If the base id is already used, pick a suffixed variant
          // and rebuild the record with the suffix applied.
          if (usedWallIds.has(baseId)) {
            let n = 2;
            while (usedWallIds.has(`${baseId}-${n}`)) n++;
            const suffix = String(n);
            usedWallIds.add(`${baseId}-${n}`);
            return buildWall(g, i, suffix);
          }

          usedWallIds.add(baseId);
          return probe;
        });

        // Composite walls carry the same id as their semantic
        // counterpart. `composeWallFromGroup` derives the id from
        // `group[0].groupId ?? group[0].id` — the base id, not the
        // suffixed one. Rewrite the composite's id to match the
        // semantic record, which we know is unique now.
        const compositeWallElements: CompositeElement[] = wallGroups
          .map((g, i) => {
            const comp = composeWallFromGroup(g);
            if (!comp) return null;
            // Use the semantic wall's id (already unique) as the
            // composite's id.
            return { ...comp, id: String(walls[i]?.id ?? comp.id) };
          })
          .filter((el): el is CompositeElement => el !== null);

        // ── Doors — block grouping (app.py groups them) ────────────
        const doorElements = normalizedElements.filter(
          (el) => getElementType(el) === "door"
        );
        const doorGroups = groupElementsByKey(doorElements);
        const doors: DoorData[] = doorGroups.map((g) => buildDoor(g));
        const compositeDoorElements: CompositeElement[] = doorGroups
          .map((g) => composeDoorFromGroup(g))
          .filter((el): el is CompositeElement => el !== null);

        // ── Windows — block grouping (app.py groups them) ──────────
        const windowElements = normalizedElements.filter(
          (el) => getElementType(el) === "window"
        );
        const windowGroups = groupElementsByKey(windowElements);
        const windows = windowGroups.map((g) => buildWindow(g));
        const compositeWindowElements: CompositeElement[] = windowGroups
          .map((g) => composeWindowFromGroup(g))
          .filter((el): el is CompositeElement => el !== null);

        // ── Rooms — semantic records + elements ────────────────────
        const rawRooms = plan.rooms || plan.Rooms || [];
        const rooms = rawRooms.map((r: any) => buildRoom(r));

        // ── Fixtures — pass through untouched ──────────────────────
        const fixtureElements = normalizedElements.filter(
          (el) => getElementType(el) === "fixture"
        );

        // ── Raw geometry — pass through untouched ──────────────────
        const rawGeometryElements = normalizedElements.filter((el) => {
          const t = getElementType(el);
          return (
            t !== "wall" &&
            t !== "door" &&
            t !== "window" &&
            t !== "fixture" &&
            t !== "room"
          );
        });

        // ── Final element list ─────────────────────────────────────
        const elements = [
          ...compositeDoorElements,
          ...compositeWindowElements,
          ...compositeWallElements,
          ...rooms,
          ...fixtureElements,
          ...rawGeometryElements,
        ];

        // ── Preserve document identity ─────────────────────────────
        const urlParams = new URLSearchParams(window.location.search);
        const urlDocId = urlParams.get("documentId");
        const globalDocId = (window as any).__activeDocumentId;

        const preservedDocId =
          urlDocId || currentDocument?.id || globalDocId || `dxf-${Date.now()}`;

        const preservedName = currentDocument?.name || "Imported DXF";

        const dxfBaseName = uploadedFile.name
          .replace(/\.[^/.]+$/, "")
          .toUpperCase();

        const updatedDocument = {
          ...currentDocument,
          id: preservedDocId,
          name: preservedName,
          importedDrawingName: dxfBaseName,
          fingerprint:
            plan.fingerprint !== undefined
              ? plan.fingerprint
              : (plan as any).Fingerprint,

          elements,

          walls: walls.map((w: any) => ({
            ...w,
            endX: Number(w.endX),
            endY: Number(w.endY),
          })),
          doors,
          windows: windows.map((w: any) => ({
            ...w,
            endX: Number(w.endX),
            endY: Number(w.endY),
          })),
          rooms,
        };

        const win = window as any;
        win.__persistentDwgVectorBackupCache = [];
        win.__hiddenLayersMap = {};
        win.__viewportState = undefined;
        win.__viewportInstance = undefined;
        win.__floorPlanActiveViewportInstance = undefined;

        dispatch(setDocument(updatedDocument));
        dispatch(markDirty());

        win.__floorPlanActiveDocumentInstance = updatedDocument;

        window.dispatchEvent(new CustomEvent("sbs:force-autofit-camera"));
        window.dispatchEvent(new CustomEvent("sbs:canvas-update"));
        window.dispatchEvent(new CustomEvent("canvas-invalidate"));
      } catch (err: any) {
        setError(err.message || "DXF import failed.");
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [dispatch, currentDocument]
  );

  return {
    fileInputRef,
    importing,
    error,
    triggerFilePicker,
    handleFileChange,
    clearError: () => setError(null),
  };
}

export default UseDxfImport;