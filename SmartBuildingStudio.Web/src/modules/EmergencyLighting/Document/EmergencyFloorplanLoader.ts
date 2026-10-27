// src/modules/EmergencyLighting/Document/EmergencyFloorplanLoader.ts

import { API_ROUTES } from '@/Application/ApiRoutes';
import { BackendPayloadMapper } from '@/modules/FloorPlanDesigner/Store/BackendPayloadMapper';
import { transformDbSchemaToCanvasSchema } from '@/modules/FloorPlanDesigner/Utils/DatabaseToCanvasTransformer';

export interface EmergencyFloorplanRenderModel {
  documentId: string;
  documentName: string;
  elements: any[];
  walls: any[];
  doors: any[];
  windows: any[];
  rooms: any[];
  _rawPayload?: any;
}

export type LoadFloorplanOutcome =
  | { ok: true; model: EmergencyFloorplanRenderModel }
  | { ok: false; error: string };

export const EmergencyFloorplanLoader = {
  async load(floorplanId: string, includeRawGeometry: boolean = false): Promise<LoadFloorplanOutcome> {
    try {
      const url = API_ROUTES.PROJECT_EXPLORER_SERVICE.DOCUMENTS.GET(floorplanId);
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      });

      if (!response.ok) {
        return { ok: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }

      const data = await response.json();

      const parsedDocument: any = BackendPayloadMapper.fromLegacyBackend(data);
      parsedDocument.id = data.id || data.documentId || floorplanId;

      const previousHidden = (window as any).__hiddenLayersMap;
      let plan: any;
      try {
        // Skip raw geometry on the initial fast load
        (window as any).__hiddenLayersMap = includeRawGeometry ? {} : { rawgeometry: true };
        plan = transformDbSchemaToCanvasSchema(parsedDocument);
      } finally {
        (window as any).__hiddenLayersMap = previousHidden;
      }

      // Merge room metadata into room elements
      const roomsById = new Map<string, any>();
      for (const r of parsedDocument.rooms || []) {
        const rid = String(r?.id ?? r?.Id ?? '');
        if (rid) roomsById.set(rid, r);
      }

      const mergedElements = (plan.elements || []).map((el: any) => {
        const t = String(el?.type ?? '').toLowerCase();
        const isRoom = t === 'room' || t === 'rooms' || el?.isRoom === true;
        if (!isRoom) return el;

        const eid = String(el?.id ?? el?.Id ?? '');
        const room = roomsById.get(eid);
        if (!room) return el;

        return {
          ...el,
          type: 'room',
          isRoom: true,
          name: el.name ?? room.name ?? 'Unnamed Room',
          targetLux: el.targetLux ?? room.targetLux ?? 500,
          primaryGroup: el.primaryGroup ?? room.primaryGroup ?? 1,
          points: el.points || room.points || el.vertices || [],
        };
      });

      const elementIds = new Set(mergedElements.map((e: any) => String(e?.id ?? '')));
      for (const room of parsedDocument.rooms || []) {
        const rid = String(room?.id ?? room?.Id ?? '');
        if (!rid || elementIds.has(rid)) continue;
        const pts = room.points || room.vertices || [];
        if (!Array.isArray(pts) || pts.length < 3) continue;
        mergedElements.push({
          id: rid,
          type: 'room',
          isRoom: true,
          originalLayer: 'rooms',
          layer: 'rooms',
          name: room.name ?? 'Unnamed Room',
          targetLux: room.targetLux ?? 500,
          primaryGroup: room.primaryGroup ?? 1,
          points: pts,
          rotation: 0,
        });
      }

      return {
        ok: true,
        model: {
          documentId: parsedDocument.id,
          documentName: parsedDocument.name || 'Untitled',
          elements: mergedElements,
          walls: plan.walls || parsedDocument.walls || [],
          doors: plan.doors || parsedDocument.doors || [],
          windows: plan.windows || parsedDocument.windows || [],
          rooms: plan.rooms || parsedDocument.rooms || [],
          _rawPayload: data,
        }
      };
    } catch (error: any) {
      return { ok: false, error: error?.message || 'Unknown error' };
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
      (el: any) => String(el.type).toLowerCase() === 'rawgeometry'
    );
  }
};