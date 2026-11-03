// src/modules/Commissioning/Document/CommissioningFloorplanLoader.ts

import { API_ROUTES } from '@/Application/ApiRoutes';
import { BackendPayloadMapper } from '@/modules/FloorPlanDesigner/Store/BackendPayloadMapper';
import { transformDbSchemaToCanvasSchema } from '@/modules/FloorPlanDesigner/Utils/DatabaseToCanvasTransformer';

export interface CommissioningFixture {
  id: string;
  x: number;
  y: number;
  kind: string;
  rotation: number;
  roomId: string | null;
  productId?: string;
  productName?: string;
  daliGroup?: number;
}

export interface CommissioningFloorplanRenderModel {
  documentId: string;
  documentName: string;
  elements: any[];
  walls: any[];
  doors: any[];
  windows: any[];
  rooms: any[];
  electricalFixtures: any[];
  fixtures: CommissioningFixture[];
  _rawPayload?: any;
}

export type LoadCommissioningFloorplanOutcome =
  | { ok: true; model: CommissioningFloorplanRenderModel }
  | { ok: false; error: string };

function isRawGeometry(el: any): boolean {
  return String(el?.type ?? '').toLowerCase() === 'rawgeometry';
}

function hasValidCoords(el: any): boolean {
  if (!el) return false;
  const pts: any[] =
    (Array.isArray(el.points) && el.points) ||
    (Array.isArray(el.vertices) && el.vertices) ||
    (el.start && el.end ? [el.start, el.end] : []) ||
    [];
  if (!Array.isArray(pts) || pts.length === 0) return false;
  return pts.some(
    (p: any) =>
      p &&
      typeof p.x === 'number' &&
      typeof p.y === 'number' &&
      Number.isFinite(p.x) &&
      Number.isFinite(p.y),
  );
}

function extractFixtures(raw: any, parsedDoc: any): CommissioningFixture[] {
  const candidates: any[] =
    Array.isArray(parsedDoc?.electricalFixtures) ? parsedDoc.electricalFixtures :
    Array.isArray((raw as any)?.electricalFixtures) ? (raw as any).electricalFixtures :
    [];

  let source = candidates;
  if (source.length === 0) {
    const blob =
      raw?.placedFixturesJson ??
      raw?.PlacedFixturesJson ??
      parsedDoc?.placedFixturesJson ??
      parsedDoc?.PlacedFixturesJson;
    if (blob) {
      try {
        const parsed = typeof blob === 'string' ? JSON.parse(blob) : blob;
        const fromBlob = parsed?.electricalFixtures;
        if (Array.isArray(fromBlob)) source = fromBlob;
      } catch (e) {
        console.warn('[CommissioningFloorplanLoader] PlacedFixturesJson parse failed', e);
      }
    }
  }

  const out: CommissioningFixture[] = [];
  for (const f of source) {
    if (!f) continue;
    const id = String(f.id ?? f.Id ?? '');
    if (!id) continue;
    const x = Number(f.x ?? f.X ?? f.position?.x ?? 0);
    const y = Number(f.y ?? f.Y ?? f.position?.y ?? 0);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    out.push({
      id,
      x,
      y,
      kind: String(f.kind ?? f.Kind ?? f.type ?? f.Type ?? 'luminaire'),
      rotation: Number(f.rotation ?? f.Rotation ?? 0),
      roomId: f.roomId ?? f.RoomId ?? null,
      productId: f.productId ?? f.ProductId,
      productName: f.productName ?? f.ProductName,
      daliGroup: f.daliGroup ?? f.DaliGroup,
    });
  }
  return out;
}

export const CommissioningFloorplanLoader = {
  async load(
    floorplanId: string,
    includeRawGeometry: boolean = true,  // default: include, matches toggle-on
  ): Promise<LoadCommissioningFloorplanOutcome> {
    if (!floorplanId) return { ok: false, error: 'floorplanId is required' };

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
        (window as any).__hiddenLayersMap = includeRawGeometry
          ? {}
          : { rawgeometry: true };
        plan = transformDbSchemaToCanvasSchema(parsedDocument);
      } finally {
        (window as any).__hiddenLayersMap = previousHidden;
      }

      const roomsById = new Map<string, any>();
      for (const r of parsedDocument.rooms || []) {
        const rid = String(r?.id ?? r?.Id ?? '');
        if (rid) roomsById.set(rid, r);
      }

      const rawElements: any[] = plan.elements || [];
      const validElements = rawElements.filter((el: any) => {
        if (!includeRawGeometry && isRawGeometry(el)) return false;
        return hasValidCoords(el);
      });

      const mergedElements: any[] = validElements.map((el: any) => {
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
        const valid = pts.filter(
          (p: any) => p && Number.isFinite(p.x) && Number.isFinite(p.y),
        );
        if (valid.length < 3) continue;
        mergedElements.push({
          id: rid,
          type: 'room',
          isRoom: true,
          originalLayer: 'rooms',
          layer: 'rooms',
          name: room.name ?? 'Unnamed Room',
          targetLux: room.targetLux ?? 500,
          primaryGroup: room.primaryGroup ?? 1,
          points: valid,
          rotation: 0,
        });
      }

      const electricalFixtures =
        (plan.electricalFixtures && plan.electricalFixtures.length > 0)
          ? plan.electricalFixtures
          : (parsedDocument.electricalFixtures ?? []);
      const fixtures = extractFixtures(data, parsedDocument);

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
          electricalFixtures,
          fixtures,
          _rawPayload: data,
        },
      };
    } catch (error: any) {
      console.error('[CommissioningFloorplanLoader] load failed:', error);
      return { ok: false, error: error?.message || 'Unknown error' };
    }
  },
};

export default CommissioningFloorplanLoader;