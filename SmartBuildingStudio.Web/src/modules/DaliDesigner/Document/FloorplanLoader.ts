// src/modules/DaliDesigner/Document/FloorplanLoader.ts

import { BackendPayloadMapper } from "@/modules/FloorPlanDesigner/Store/BackendPayloadMapper";
import { transformDbSchemaToCanvasSchema } from "@/modules/FloorPlanDesigner/Utils/DatabaseToCanvasTransformer";
import { DaliApi } from "@/modules/DaliDesigner/services/DaliApi";

export interface RenderElement {
  id: string;
  type: string;
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
  elements: RenderElement[];
  walls: any[];
  doors: any[];
  windows: any[];
  rooms: any[];
  placedFixturesJson: any;
  pixelsToMetresScale: number;
  /** Cached raw payload so raw geometry can be extracted on demand. */
  _rawPayload?: any;
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
  async load(
    floorplanId: string,
    includeRawGeometry: boolean = false
  ): Promise<LoadFloorplanOutcome> {
    if (!floorplanId) {
      return { ok: false, error: "floorplanId is required" };
    }

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
      const parsedDocument: any = BackendPayloadMapper.fromLegacyBackend(data);
      parsedDocument.id =
        (data as any).id ?? (data as any).documentId ?? parsedDocument.id;

      const previousHidden = (window as any).__hiddenLayersMap;
      let plan: any;
      try {
        // Fast path: hide raw geometry by default so the transformer skips it
        (window as any).__hiddenLayersMap = includeRawGeometry ? {} : { rawgeometry: true };
        plan = transformDbSchemaToCanvasSchema(parsedDocument);
      } finally {
        (window as any).__hiddenLayersMap = previousHidden;
      }

      const roomsById = new Map<string, any>();
      for (const r of parsedDocument.rooms || []) {
        const rid = String(r?.id ?? r?.Id ?? "");
        if (rid) roomsById.set(rid, r);
      }

      const mergedElements: RenderElement[] = (plan.elements || []).map((el: any) => {
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
      });

      const elementIds = new Set(mergedElements.map((e) => String(e?.id ?? "")));
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
          _rawPayload: data,
        },
      };
    } catch (error: any) {
      console.error("[FloorplanLoader] parse/transform failed:", error);
      return {
        ok: false,
        error: error?.message ?? "Failed to parse floorplan document",
      };
    }
  },

  extractRawGeometry(rawPayload: any): any[] {
    const parsed = BackendPayloadMapper.fromLegacyBackend(rawPayload);
    const previousHidden = (window as any).__hiddenLayersMap;
    let plan: any;
    try {
      (window as any).__hiddenLayersMap = {};
      plan = transformDbSchemaToCanvasSchema(parsed);
    } finally {
      (window as any).__hiddenLayersMap = previousHidden;
    }
    return (plan.elements || []).filter(
      (el: any) => String(el.type).toLowerCase() === "rawgeometry"
    );
  },
};

export default FloorplanLoader;