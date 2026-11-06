// src/modules/DeviceDiscovery/Document/DeviceDiscoveryFloorplanLoader.ts

import { API_ROUTES } from '@/Application/ApiRoutes';
import { BackendPayloadMapper } from '@/modules/FloorPlanDesigner/Store/BackendPayloadMapper';
import { transformDbSchemaToCanvasSchema } from '@/modules/FloorPlanDesigner/Utils/DatabaseToCanvasTransformer';

export interface DiscoveryFixture {
  id: string;
  x: number;
  y: number;
  kind: string;
  rotation: number;
  roomId: string | null;
  productId?: string;
  productName?: string;
  daliGroup?: number;
  shortAddress?: number;
  lineId?: string;
  groupIds?: string[];
}

export interface DiscoveryDaliLine {
  lineId: string;
  name: string;
  controllerAddress: number;
  designedFixtureCount: number;
  isReachable: boolean;
}

export interface DeviceDiscoveryFloorplanRenderModel {
  documentId: string;
  documentName: string;
  projectId: string;
  projectName: string;
  buildingId: string;
  buildingName: string;
  floorId: string;
  floorName: string;
  elements: any[];
  walls: any[];
  doors: any[];
  windows: any[];
  rooms: any[];
  electricalFixtures: any[];
  fixtures: DiscoveryFixture[];
  daliLines: DiscoveryDaliLine[];
  _rawPayload?: any;
}

export type LoadDeviceDiscoveryFloorplanOutcome =
  | { ok: true; model: DeviceDiscoveryFloorplanRenderModel }
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

function extractDesignFixtures(raw: any, parsedDoc: any): DiscoveryFixture[] {
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
        console.warn('[DeviceDiscoveryFloorplanLoader] PlacedFixturesJson parse failed', e);
      }
    }
  }

  const out: DiscoveryFixture[] = [];
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
      shortAddress: undefined,
      lineId: undefined,
      groupIds: undefined,
    });
  }
  return out;
}

async function loadDaliNetworks(
  projectId: string,
  floorplanId: string,
  fixtures: DiscoveryFixture[],
): Promise<DiscoveryDaliLine[]> {
  try {
    const listUrl = API_ROUTES.DALI_DESIGNER_SERVICE.NETWORKS_FOR_FLOORPLAN(projectId, floorplanId);
    const listRes = await fetch(listUrl, { headers: { Accept: 'application/json' } });
    if (!listRes.ok) return [];

    const list = await listRes.json() as Array<{ id: string; name?: string }>;
    if (!Array.isArray(list) || list.length === 0) return [];

    const fixtureById = new Map<string, DiscoveryFixture>();
    for (const f of fixtures) fixtureById.set(f.id, f);

    const daliLines: DiscoveryDaliLine[] = [];

    for (const net of list) {
      try {
        const detailUrl = API_ROUTES.DALI_DESIGNER_SERVICE.NETWORK(projectId, net.id);
        const detailRes = await fetch(detailUrl, { headers: { Accept: 'application/json' } });
        if (!detailRes.ok) continue;
        const detail = await detailRes.json() as any;

        const rawLines: any[] = Array.isArray(detail?.lines) ? detail.lines : [];
        for (let i = 0; i < rawLines.length; i++) {
          const l = rawLines[i];
          const lineId = String(l.id ?? `line-${i + 1}`);
          const fixturesOnLine = fixtures.filter(f => f.lineId === lineId);
          daliLines.push({
            lineId,
            name: String(l.name ?? `DALI Line ${i + 1}`),
            controllerAddress: i + 1,
            designedFixtureCount: fixturesOnLine.length,
            isReachable: true,
          });
        }

        const devices: any[] = Array.isArray(detail?.devices) ? detail.devices : [];
        for (const d of devices) {
          const sourceFixtureId = String(d.sourceFixtureId ?? d.sourceId ?? '');
          const fixture = fixtureById.get(sourceFixtureId);
          if (!fixture) continue;

          fixture.lineId = String(d.lineId ?? '');
          fixture.shortAddress = typeof d.address === 'number' ? d.address : undefined;
          fixture.groupIds = Array.isArray(d.groupIds) ? d.groupIds.map(String) : undefined;
        }
      } catch (e) {
        console.warn('[DeviceDiscoveryFloorplanLoader] network detail fetch failed', e);
      }
    }

    for (const line of daliLines) {
      line.designedFixtureCount = fixtures.filter(f => f.lineId === line.lineId).length;
    }

    return daliLines;
  } catch (e) {
    console.warn('[DeviceDiscoveryFloorplanLoader] DALI network fetch failed:', e);
    return [];
  }
}

export const DeviceDiscoveryFloorplanLoader = {
  async load(
    floorplanId: string,
    projectId: string,
    includeRawGeometry: boolean = true,
  ): Promise<LoadDeviceDiscoveryFloorplanOutcome> {
    if (!floorplanId) return { ok: false, error: 'floorplanId is required' };
    if (!projectId) return { ok: false, error: 'projectId is required' };

    try {
      const docUrl = API_ROUTES.PROJECT_EXPLORER_SERVICE.DOCUMENTS.GET(floorplanId);
      const docRes = await fetch(docUrl, {
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      });
      if (!docRes.ok) {
        return { ok: false, error: `HTTP ${docRes.status}: ${docRes.statusText}` };
      }
      const data = await docRes.json();

      const parsedDocument: any = BackendPayloadMapper.fromLegacyBackend(data);
      parsedDocument.id = data.id || data.documentId || floorplanId;

      const previousHidden = (window as any).__hiddenLayersMap;
      let plan: any;
      try {
        (window as any).__hiddenLayersMap = includeRawGeometry ? {} : { rawgeometry: true };
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
      const fixtures = extractDesignFixtures(data, parsedDocument);

      const daliLines = await loadDaliNetworks(projectId, floorplanId, fixtures);

      const projectName = data.projectName || data.ProjectName || data.activeProjectName || parsedDocument.activeProjectName || 'Project';
      const buildingName = data.buildingName || data.BuildingName || data.activeBuildingName || parsedDocument.activeBuildingName || 'Building';
      const floorName = data.floorName || data.FloorName || data.activeFloorName || parsedDocument.activeFloorName || 'Floor';

      return {
        ok: true,
        model: {
          documentId: parsedDocument.id,
          documentName: parsedDocument.name || 'Untitled',
          projectId,
          projectName,
          buildingId: data.buildingId || parsedDocument.buildingId || '',
          buildingName,
          floorId: data.floorId || parsedDocument.floorId || '',
          floorName,
          elements: mergedElements,
          walls: plan.walls || parsedDocument.walls || [],
          doors: plan.doors || parsedDocument.doors || [],
          windows: plan.windows || parsedDocument.windows || [],
          rooms: plan.rooms || parsedDocument.rooms || [],
          electricalFixtures,
          fixtures,
          daliLines,
          _rawPayload: data,
        },
      };
    } catch (error: any) {
      console.error('[DeviceDiscoveryFloorplanLoader] load failed:', error);
      return { ok: false, error: error?.message || 'Unknown error' };
    }
  },
};

export default DeviceDiscoveryFloorplanLoader;