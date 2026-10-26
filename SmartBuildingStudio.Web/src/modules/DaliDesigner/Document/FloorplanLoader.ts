// src/modules/DaliDesigner/Document/FloorplanLoader.ts
//
// Loads the floorplan geometry for a given ProjectDocument id and
// returns it in the render-ready shape that both FixturePlacementStudio
// and the DALI canvas consume.
//
// Pipeline (identical to FixturePlacementStudio.FixtureDocumentManager.load
// up to the point where fixtures diverge):
//
//   DaliApi.getFloorplanDocument(id)
//     ↓  (HTTP transport — see services/DaliApi.ts)
//   BackendPayloadMapper.fromLegacyBackend(data)
//     → { elements, walls, doors, windows, rooms, placedFixturesJson, ... }
//     ↓
//   transformDbSchemaToCanvasSchema(parsed)
//     → ArchitecturalPlan { elements, walls, doors, windows, rooms }
//     ↓
//   merge room metadata into room elements
//     ↓
//   FloorplanRenderModel { elements, walls, doors, windows, rooms, ... }
//
// Fixtures are NOT read here. The DALI module sources fixtures through
// DaliApi.getPlacedFixtures() (Option 2a — the /fixtures endpoint), so
// this loader stays focused on geometry only.

import { BackendPayloadMapper } from "@/modules/FloorPlanDesigner/Store/BackendPayloadMapper";
import { transformDbSchemaToCanvasSchema } from "@/modules/FloorPlanDesigner/Utils/DatabaseToCanvasTransformer";
import { DaliApi } from "@/modules/DaliDesigner/services/DaliApi";

/**
 * Minimal typed shape of one render primitive. The canvas iterates
 * `elements` and switches on `type`. Matches what
 * DrawingDocument.loadFromState accepts and what the
 * FloorPlanDesigner canvas renderer consumes.
 */
export interface RenderElement {
  id: string;
  type: string; // "wall" | "door" | "window" | "room" | "fixture" | ...
  points: Array<{ x: number; y: number }>;
  rotation?: number;
  originalLayer?: string;
  layer?: string;
  isRoom?: boolean;
  name?: string;
  targetLux?: number;
  primaryGroup?: number;
  [key: string]: any;
}

export interface FloorplanRenderModel {
  documentId: string;
  documentName: string;
  /** Render primitives — the canvas iterates this array. */
  elements: RenderElement[];
  /** Typed mirrors — kept for consumers that prefer arrays. */
  walls: any[];
  doors: any[];
  windows: any[];
  rooms: any[];
  /** Raw fixture payload (kept for diagnostics only; not rendered). */
  placedFixturesJson: any;
  pixelsToMetresScale: number;
}

export interface LoadFloorplanResult {
  ok: true;
  model: FloorplanRenderModel;
}

export interface LoadFloorplanFailure {
  ok: false;
  error: string;
}

export type LoadFloorplanOutcome = LoadFloorplanResult | LoadFloorplanFailure;

export const FloorplanLoader = {
  async load(floorplanId: string): Promise<LoadFloorplanOutcome> {
    if (!floorplanId) {
      return { ok: false, error: "floorplanId is required" };
    }

    // ── 1. Fetch the raw ProjectDocument ──────────────────────────────
    // Delegates transport + error handling to DaliApi. No direct fetch.
    let data: any;
    try {
      data = await DaliApi.getFloorplanDocument(floorplanId);
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "Load failed" };
    }

    if (!data || typeof data !== "object") {
      return { ok: false, error: "Document payload was empty or malformed" };
    }

    try {
      // ── 2. Raw payload → parsed document ──────────────────────────
      // BackendPayloadMapper.fromLegacyBackend normalizes PascalCase /
      // camelCase, extracts the three JSON blobs, and classifies rooms.
      const parsedDocument: any = BackendPayloadMapper.fromLegacyBackend(data);
      parsedDocument.id =
        (data as any).id ?? (data as any).documentId ?? parsedDocument.id;

      // ── 3. Parsed document → render plan ──────────────────────────
      // The transformer reads a window-level hidden-layers map. Mirror
      // FixturePlacementStudio's save/restore so this call doesn't
      // disturb any other module's state.
      const previousHidden = (window as any).__hiddenLayersMap;
      let plan: any;
      try {
        (window as any).__hiddenLayersMap = {};
        plan = transformDbSchemaToCanvasSchema(parsedDocument);
      } finally {
        (window as any).__hiddenLayersMap = previousHidden;
      }

      // ── 4a. Merge room metadata into room elements ────────────────
      // Room geometry lives in `elements`; name/targetLux/primaryGroup
      // live in parsedDocument.rooms (from DefinedRoomsJson). We merge
      // so the canvas can render labels correctly on first paint.
      const roomsById = new Map<string, any>();
      for (const r of parsedDocument.rooms || []) {
        const rid = String(r?.id ?? r?.Id ?? "");
        if (rid) roomsById.set(rid, r);
      }

      const mergedElements: RenderElement[] = (plan.elements || []).map(
        (el: any) => {
          const t = String(el?.type ?? "").toLowerCase();
          const isRoom = t === "room" || t === "rooms" || el?.isRoom === true;
          if (!isRoom) return el as RenderElement;

          const eid = String(el?.id ?? el?.Id ?? "");
          const room = roomsById.get(eid);
          if (!room) return el as RenderElement;

          return {
            ...el,
            type: "room",
            isRoom: true,
            name: el.name ?? room.name ?? "Unnamed Room",
            targetLux: el.targetLux ?? room.targetLux ?? 500,
            primaryGroup: el.primaryGroup ?? room.primaryGroup ?? 1,
            points: el.points || room.points || el.vertices || [],
          } as RenderElement;
        }
      );

      // ── 4b. Add rooms that exist only in parsedDocument.rooms ─────
      // A room defined in DefinedRoomsJson but not present in `elements`
      // would otherwise be invisible. Catch those here.
      const elementIds = new Set(
        mergedElements.map((e) => String(e?.id ?? ""))
      );
      for (const room of parsedDocument.rooms || []) {
        const rid = String(room?.id ?? room?.Id ?? "");
        if (!rid || elementIds.has(rid)) continue;
        const pts = room.points || room.vertices || [];
        if (!Array.isArray(pts) || pts.length < 3) continue;
        mergedElements.push({
          id: rid,
          type: "room",
          isRoom: true,
          originalLayer: "rooms",
          layer: "rooms",
          name: room.name ?? "Unnamed Room",
          targetLux: room.targetLux ?? 500,
          primaryGroup: room.primaryGroup ?? 1,
          points: pts,
          rotation: 0,
        });
      }

      // ── 5. Assemble the render model ──────────────────────────────
      return {
        ok: true,
        model: {
          documentId: parsedDocument.id || floorplanId,
          documentName: parsedDocument.name || "Untitled",
          elements: mergedElements,
          walls: plan.walls || parsedDocument.walls || [],
          doors: plan.doors || parsedDocument.doors || [],
          windows: plan.windows || parsedDocument.windows || [],
          rooms: plan.rooms || parsedDocument.rooms || [],
          placedFixturesJson: parsedDocument.placedFixturesJson ?? null,
          pixelsToMetresScale:
            typeof (data as any).pixelsToMetresScale === "number"
              ? (data as any).pixelsToMetresScale
              : 1.0,
        },
      };
    } catch (error: any) {
      // Any error in the parse/transform pipeline lands here — the
      // network layer already returned cleanly in step 1.
      console.error("[FloorplanLoader] parse/transform failed:", error);
      return {
        ok: false,
        error: error?.message ?? "Failed to parse floorplan document",
      };
    }
  },
};

export default FloorplanLoader;