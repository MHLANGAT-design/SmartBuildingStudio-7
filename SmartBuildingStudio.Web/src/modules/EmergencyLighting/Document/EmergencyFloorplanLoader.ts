// src/modules/EmergencyLighting/Document/EmergencyFloorplanLoader.ts

import { API_ROUTES } from '@/Application/ApiRoutes';
import { BackendPayloadMapper } from '@/modules/FloorPlanDesigner/Store/BackendPayloadMapper';
import { transformDbSchemaToCanvasSchema } from '@/modules/FloorPlanDesigner/Utils/DatabaseToCanvasTransformer';
import { extractRoutesFromElements } from '@/modules/EmergencyLighting/Document/projectRoutes';
import type { Fixture } from '@/modules/FixturePlacementStudio/models/Fixture';
import { deserializeFixture } from '@/modules/FixturePlacementStudio/models/Fixture';
import type { Zone } from '@/modules/FixturePlacementStudio/models/Zone';
import { deserializeZone } from '@/modules/FixturePlacementStudio/models/Zone';

export interface EmergencyFloorplanRenderModel {
  documentId: string;
  documentName: string;
  elements: any[];
  walls: any[];
  doors: any[];
  windows: any[];
  rooms: any[];
  electricalFixtures: any[];
  /** FPS-typed fixtures, deserialized from PlacedFixturesJson.electricalFixtures. */
  fixtures: Fixture[];
  /** FPS-typed lighting zones, deserialized from PlacedFixturesJson.lightingZones. */
  zones: Zone[];
  exitRoutes: any[];
  _rawPayload?: any;
}

export type LoadFloorplanOutcome =
  | { ok: true; model: EmergencyFloorplanRenderModel }
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
    (Array.isArray(el.primitives)
      ? el.primitives.flatMap((p: any) => p?.points ?? [])
      : []) ||
    [];

  if (!Array.isArray(pts) || pts.length === 0) return false;

  return pts.some(
    (p: any) =>
      p &&
      typeof p.x === 'number' &&
      typeof p.y === 'number' &&
      Number.isFinite(p.x) &&
      Number.isFinite(p.y)
  );
}

function extractElectricalFixtures(raw: any, parsedDoc: any): any[] {
  if (Array.isArray(parsedDoc?.electricalFixtures) && parsedDoc.electricalFixtures.length > 0) {
    return parsedDoc.electricalFixtures;
  }

  const blob =
    raw?.placedFixturesJson ??
    raw?.PlacedFixturesJson ??
    parsedDoc?.placedFixturesJson ??
    parsedDoc?.PlacedFixturesJson;

  if (blob) {
    try {
      const parsed = typeof blob === 'string' ? JSON.parse(blob) : blob;
      const fromBlob = parsed?.electricalFixtures;
      if (Array.isArray(fromBlob)) {
        return fromBlob.map((f: any) => ({
          id: f.id ?? f.Id ?? '',
          kind: f.kind ?? f.Kind ?? f.type ?? f.Type ?? 'luminaire',
          x: Number(f.x ?? f.X ?? f.position?.x ?? f.Position?.x ?? 0),
          y: Number(f.y ?? f.Y ?? f.position?.y ?? f.Position?.y ?? 0),
          roomId: f.roomId ?? f.RoomId ?? null,
          productId: f.productId ?? f.ProductId,
          productName: f.productName ?? f.ProductName,
          rotation: Number(f.rotation ?? f.Rotation ?? 0),
          elevation: Number(f.elevation ?? f.Elevation ?? 0),
          metadata: f.metadata ?? f.Metadata,
          properties: f.properties ?? f.Properties,
        }));
      }
    } catch (e) {
      console.warn('[EmergencyFloorplanLoader] PlacedFixturesJson parse failed', e);
    }
  }

  const inline = raw?.electricalFixtures ?? parsedDoc?.electricalFixtures;
  return Array.isArray(inline) ? inline : [];
}

/**
 * Reads the raw PlacedFixturesJson blob and returns its `lightingZones`
 * array deserialized through FPS's Zone model. Returns [] when the field
 * is absent or malformed — FPS does not author zones yet, so absence is
 * the normal case today.
 */
function extractLightingZones(raw: any, parsedDoc: any): Zone[] {
  const blob =
    raw?.placedFixturesJson ??
    raw?.PlacedFixturesJson ??
    parsedDoc?.placedFixturesJson ??
    parsedDoc?.PlacedFixturesJson;

  if (!blob) return [];

  let parsed: any;
  try {
    parsed = typeof blob === 'string' ? JSON.parse(blob) : blob;
  } catch (e) {
    console.warn('[EmergencyFloorplanLoader] PlacedFixturesJson parse failed (zones)', e);
    return [];
  }

  const rawZones = parsed?.lightingZones ?? parsed?.LightingZones;
  if (!Array.isArray(rawZones)) return [];

  const out: Zone[] = [];
  for (const r of rawZones) {
    const z = deserializeZone(r);
    if (z) out.push(z);
  }
  return out;
}

/**
 * Deserializes raw fixture entries through FPS's Fixture model. Entries
 * that fail validation are dropped; the raw `electricalFixtures` array on
 * the model is kept intact so ComplianceEngine can keep reading whatever
 * it reads today.
 */
function deserializeFixtures(rawFixtures: any[]): Fixture[] {
  const out: Fixture[] = [];
  for (const r of rawFixtures) {
    const f = deserializeFixture(r);
    if (f) out.push(f);
  }
  return out;
}

export const EmergencyFloorplanLoader = {
  async load(
    floorplanId: string,
    includeRawGeometry: boolean = false
  ): Promise<LoadFloorplanOutcome> {
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

      const droppedCount = rawElements.length - validElements.length;
      if (droppedCount > 0) {
        console.log(
          `[EmergencyFloorplanLoader] Dropped ${droppedCount} elements (raw geometry + invalid coords)`
        );
      }

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

      const elementIds = new Set(
        mergedElements.map((e: any) => String(e?.id ?? ''))
      );
      for (const room of parsedDocument.rooms || []) {
        const rid = String(room?.id ?? room?.Id ?? '');
        if (!rid || elementIds.has(rid)) continue;

        const pts = room.points || room.vertices || [];
        if (!Array.isArray(pts) || pts.length < 3) continue;

        const valid = pts.filter(
          (p: any) => p && Number.isFinite(p.x) && Number.isFinite(p.y)
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

      const electricalFixtures = extractElectricalFixtures(data, parsedDocument);
      const fixtures = deserializeFixtures(electricalFixtures);
      const zones = extractLightingZones(data, parsedDocument);
      const exitRoutes = extractRoutesFromElements(mergedElements);

      console.log('[EmergencyFloorplanLoader] model ready', {
        total: mergedElements.length,
        walls: (plan.walls || parsedDocument.walls || []).length,
        doors: (plan.doors || parsedDocument.doors || []).length,
        windows: (plan.windows || parsedDocument.windows || []).length,
        rooms: (plan.rooms || parsedDocument.rooms || []).length,
        electricalFixtures: electricalFixtures.length,
        fixtures: fixtures.length,
        zones: zones.length,
        exitRoutes: exitRoutes.length,
        sampleFixture: electricalFixtures[0],
      });

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
          zones,
          exitRoutes,
          _rawPayload: data,
        },
      };
    } catch (error: any) {
      console.error('[EmergencyFloorplanLoader] load failed:', error);
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
      (el: any) => isRawGeometry(el) && hasValidCoords(el)
    );
  },
};

export default EmergencyFloorplanLoader;