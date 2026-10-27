// src/modules/EmergencyLighting/Document/EmergencyDocumentManager.ts

import { API_ROUTES } from '@/Application/ApiRoutes';
import { BackendPayloadMapper } from '@/modules/FloorPlanDesigner/Store/BackendPayloadMapper';
import { transformDbSchemaToCanvasSchema } from '@/modules/FloorPlanDesigner/Utils/DatabaseToCanvasTransformer';
import { EmergencyDocumentSerializer } from '@/modules/EmergencyLighting/Document/EmergencyDocumentSerializer';
import { EmergencyDocument } from '@/modules/EmergencyLighting/store/emergencyTypes';

export interface LoadResult {
  ok: true;
  emergencyDoc: EmergencyDocument;
  floorplanModel: any;
}

export interface LoadFailure {
  ok: false;
  error: string;
}

export type LoadOutcome = LoadResult | LoadFailure;

export class EmergencyDocumentManager {
  static async load(documentId: string): Promise<LoadOutcome> {
    try {
      const url = API_ROUTES.PROJECT_EXPLORER_SERVICE.DOCUMENTS.GET(documentId);
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        return { ok: false, error: `Load failed (${response.status}): ${text}` };
      }

      const data = await response.json();

      // ── 1. Map the raw payload to elements ─────────────────────────
      const parsedDocument: any = BackendPayloadMapper.fromLegacyBackend(data);
      parsedDocument.id = (data as any).id ?? (data as any).documentId ?? parsedDocument.id;

      const previousHidden = (window as any).__hiddenLayersMap;
      let plan: any;
      try {
        (window as any).__hiddenLayersMap = {};
        plan = transformDbSchemaToCanvasSchema(parsedDocument);
      } finally {
        (window as any).__hiddenLayersMap = previousHidden;
      }

      // ── 2. Merge room metadata ─────────────────────────────────────
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

      // Add rooms that exist only in parsedDocument.rooms
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

      // ── 3. Assemble the plan for the canvas ────────────────────────
      const floorplanModel = {
        id: parsedDocument.id,
        name: parsedDocument.name || 'Untitled',
        elements: mergedElements,
        walls: plan.walls || parsedDocument.walls || [],
        doors: plan.doors || parsedDocument.doors || [],
        windows: plan.windows || parsedDocument.windows || [],
        rooms: plan.rooms || parsedDocument.rooms || [],
        electricalFixtures: parsedDocument.electricalFixtures || [],
      };

      // ── 4. Deserialize the Emergency Study ─────────────────────────
      const studyJson = data?.emergencyStudyJson ?? data?.EmergencyStudyJson;
      let emergencyDoc = EmergencyDocumentSerializer.fromDTO(studyJson);

      if (!emergencyDoc) {
        emergencyDoc = {
          id: parsedDocument.id,
          projectId: parsedDocument.projectId || '',
          floorplanId: parsedDocument.id,
          name: parsedDocument.name || 'Emergency Study',
          revision: parsedDocument.revision || 0,
          updatedAt: new Date().toISOString(),
          exitRoutes: [],
          complianceIssues: [],
          lastRunAt: null,
          simulationStatus: 'idle',
        };
      }

      return { ok: true, emergencyDoc, floorplanModel };
    } catch (error: any) {
      return { ok: false, error: error?.message ?? 'Unknown load error' };
    }
  }
}