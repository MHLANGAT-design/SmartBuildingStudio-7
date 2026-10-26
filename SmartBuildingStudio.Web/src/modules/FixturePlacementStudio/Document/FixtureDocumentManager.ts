// src/modules/FixturePlacementStudio/Document/FixtureDocumentManager.ts
//
// Loads and saves the DrawingDocument that FixturePlacementStudio edits.
//
// Load path (parity with FloorPlanDesigner):
//   GET /api/v1/project-explorer/documents/{id}
//     ↓
//   BackendPayloadMapper.fromLegacyBackend(data)
//     → { elements, walls, doors, windows, rooms, placedFixturesJson, ... }
//     ↓
//   transformDbSchemaToCanvasSchema(parsed)
//     → ArchitecturalPlan { elements, walls, doors, windows, rooms }
//     ↓
//   Merge room metadata (from parsed.rooms) into room elements
//     ↓
//   DrawingDocument.loadFromState
//
// Save path (v1.0):
//   Manual only. Client-side revision check.
//
//   DrawnWallsJson is REBUILT from the session's DrawingDocument —
//   the source that projectFixturesToElements keeps in sync with
//   `state.fixture.layout.fixtures`. Reading from the session (not
//   from Redux floorPlan) is required because FPS does not populate
//   `state.floorPlan.document`; reading from an empty slice would wipe
//   DrawnWallsJson.elements to an empty array on every save.
//
//   DefinedRoomsJson and PixelsToMetresScale are echoed unchanged from
//   the pre-save GET (FPS does not edit rooms or scale).
//
//   PlacedFixturesJson is REPLACED with our current layout.
//
//   Revision handling: the backend does not yet expose a revision
//   token. `readRevisionFromPayload` therefore returns 0 always. The
//   client's revision also stays at 0 — we deliberately do NOT
//   increment locally, because incrementing while the server stays at
//   0 would make every save after the first report a false conflict.
//
//   When the backend gains a real revision column, `readRevisionFromPayload`
//   will start returning real values, the client will start bumping its
//   counter on successful save, and the pre-save comparison will begin
//   detecting concurrent edits — no other change needed.

import { DrawingDocument } from '@/modules/FloorPlanDesigner/Document/DrawingDocument';
import { BackendPayloadMapper } from '@/modules/FloorPlanDesigner/Store/BackendPayloadMapper';
import { transformDbSchemaToCanvasSchema } from '@/modules/FloorPlanDesigner/Utils/DatabaseToCanvasTransformer';
import { FixtureDocument } from '@/modules/FixturePlacementStudio/Document/FixtureDocument';
import {
  deserializePlacedFixtures,
  serializeLayoutForSave,
} from '@/modules/FixturePlacementStudio/Document/FixtureDocumentSerializer';
import { createEmptyLayout } from '@/modules/FixturePlacementStudio/models/FixtureLayout';
import { API_ROUTES } from '@/Application/ApiRoutes';

// ─── Activation context ───────────────────────────────────────────────────────

/**
 * Payload passed by FloorPlanDesigner when the user clicks "Place
 * Fixtures". Mirrors the shape FloorPlanDesigner already tracks for the
 * active document.
 */
export interface ActivationContext {
  projectId: string;
  buildingId: string;
  floorId: string;
  documentId: string;
  /** Revision the document had when FloorPlanDesigner last saw it. */
  revision: number;
}

// ─── Load result ──────────────────────────────────────────────────────────────

export interface LoadResult {
  ok: true;
  fixtureDocument: FixtureDocument;
  /** Counts of entries dropped during deserialization. */
  droppedFixtures: number;
  droppedZones: number;
}

export interface LoadFailure {
  ok: false;
  error: string;
}

export type LoadOutcome = LoadResult | LoadFailure;

// ─── Save result ──────────────────────────────────────────────────────────────

export interface SaveSuccess {
  ok: true;
  /** New revision the client is now at. */
  revision: number;
}

export interface SaveConflict {
  ok: false;
  conflict: true;
  /** Revision on the server when we checked. */
  serverRevision: number;
  /** Revision the client loaded at. */
  clientRevision: number;
}

export interface SaveFailure {
  ok: false;
  conflict: false;
  error: string;
}

export type SaveOutcome = SaveSuccess | SaveConflict | SaveFailure;

// ─── Manager ──────────────────────────────────────────────────────────────────

export class FixtureDocumentManager {
  /**
   * Load the DrawingDocument the user asked to edit, and construct a
   * FixtureDocument wrapping it.
   *
   * The rendering pipeline is the same one FloorPlanDesigner uses:
   *
   *   raw payload  →  BackendPayloadMapper.fromLegacyBackend
   *                →  transformDbSchemaToCanvasSchema
   *                →  merge room metadata into room elements
   *                →  DrawingDocument.loadFromState
   *
   * `plan.elements` contains walls, doors, windows, and rooms as
   * classified primitives with `points`, which is what
   * CanvasRenderer.clearAndDraw consumes.
   *
   * Room elements carry geometry only (id + points). The room's name,
   * targetLux, and primaryGroup live in definedRoomsJson, which
   * BackendPayloadMapper reads into parsedDocument.rooms. We merge the
   * two here so labels render with the correct text on the first paint.
   */
  static async load(context: ActivationContext): Promise<LoadOutcome> {
    try {
      const url = API_ROUTES.PROJECT_EXPLORER_SERVICE.DOCUMENTS.GET(
        context.documentId
      );
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        return { ok: false, error: `Load failed (${response.status}): ${text}` };
      }

      // ── 1. Raw payload ────────────────────────────────────────────
      const data = await response.json();

      // ── 2. Parse it exactly the way FloorPlanThunks.openDrawing does.
      const parsedDocument: any = BackendPayloadMapper.fromLegacyBackend(data);
      parsedDocument.id =
        (data as any).id ?? (data as any).documentId ?? parsedDocument.id;

      // ── 3. Transform the parsed document into a render plan. ──────
      const previousHidden = (window as any).__hiddenLayersMap;
      try {
        (window as any).__hiddenLayersMap = {};

        const plan: any = transformDbSchemaToCanvasSchema(parsedDocument);

        // ── 4a. Merge room metadata into room elements. ────────────
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
            vertices: el.vertices || room.vertices || el.points || [],
          };
        });

        // Also catch rooms that exist only in parsedDocument.rooms.
        const elementIds = new Set(
          mergedElements.map((e: any) => String(e?.id ?? e?.Id ?? ''))
        );
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
            vertices: pts,
            rotation: 0,
          });
        }

        // ── 4b. Build the DrawingDocument. ─────────────────────────
        const drawingDocument = new DrawingDocument({
          metadata: {
            id: parsedDocument.id || context.documentId,
            name: parsedDocument.name || 'Untitled',
          },
        });

        drawingDocument.loadFromState({
          elements: mergedElements,
          walls: plan.walls || parsedDocument.walls || [],
          doors: plan.doors || parsedDocument.doors || [],
          windows: (plan as any).windows || parsedDocument.windows || [],
          rooms: plan.rooms || parsedDocument.rooms || [],
        });

        // ── 5. Deserialize fixtures and zones. ──────────────────────
        const placedFixtures = FixtureDocumentManager.parseJsonSafe(
          parsedDocument.placedFixturesJson ??
            (data as any).placedFixturesJson ??
            (data as any).PlacedFixturesJson
        );
        const { fixtures, zones, droppedFixtures, droppedZones } =
          deserializePlacedFixtures(placedFixtures);

        // ── 6. Construct FixtureDocument. ───────────────────────────
        const revision =
          typeof context.revision === 'number'
            ? context.revision
            : FixtureDocumentManager.readRevisionFromPayload(data);

        const fixtureDocument = new FixtureDocument({
          drawingDocument,
          revision,
        });

        const layout = createEmptyLayout({
          documentId: fixtureDocument.getDocumentId(),
          revision,
        });
        layout.fixtures = fixtures;
        layout.zones = zones;
        layout.dirty = false;
        fixtureDocument.setLayout(layout);

        return { ok: true, fixtureDocument, droppedFixtures, droppedZones };
      } finally {
        (window as any).__hiddenLayersMap = previousHidden;
      }
    } catch (error: any) {
      return { ok: false, error: error?.message ?? 'Unknown load error' };
    }
  }

  /**
   * Save the FixtureDocument back to ProjectExplorer.
   *
   * The backend's UpdateDocumentCanvasLayoutDto requires all four JSON
   * fields:
   *
   *   DrawnWallsJson       — REBUILT from the session's DrawingDocument
   *   DefinedRoomsJson     — echoed unchanged from pre-save GET
   *   PlacedFixturesJson   — REPLACED with our current layout
   *   PixelsToMetresScale  — echoed unchanged from pre-save GET
   */
  static async save(fixtureDocument: FixtureDocument): Promise<SaveOutcome> {
    const documentId = fixtureDocument.getDocumentId();
    const clientRevision = fixtureDocument.getRevision();

    // ── Step 1: pre-save fetch ────────────────────────────────────────
    let serverRevision: number;
    let currentPayload: any;
    try {
      const url = API_ROUTES.PROJECT_EXPLORER_SERVICE.DOCUMENTS.GET(documentId);
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        return {
          ok: false,
          conflict: false,
          error: `Pre-save fetch failed (${response.status}): ${text}`,
        };
      }
      currentPayload = await response.json();
      serverRevision = FixtureDocumentManager.readRevisionFromPayload(currentPayload);
    } catch (error: any) {
      return {
        ok: false,
        conflict: false,
        error: error?.message ?? 'Pre-save fetch error',
      };
    }

    // ── Step 2: conflict check ────────────────────────────────────────
    // Only meaningful when the backend actually sends a revision. While
    // it doesn't, serverRevision and clientRevision are both 0 and the
    // check is a no-op.
    if (serverRevision !== clientRevision) {
      // eslint-disable-next-line no-console
      console.warn(
        `[FixtureDocumentManager] Revision mismatch on save: client=${clientRevision} server=${serverRevision}`
      );
      return { ok: false, conflict: true, serverRevision, clientRevision };
    }

    // ── Step 3: build the save payload ────────────────────────────────
    const layout = fixtureDocument.getLayout();
    const existingPlacedFixtures = FixtureDocumentManager.parseJsonSafe(
      currentPayload?.placedFixturesJson ?? currentPayload?.PlacedFixturesJson
    );
    const newPlacedFixtures = serializeLayoutForSave(layout, existingPlacedFixtures);

    // ── Step 3a: rebuild DrawnWallsJson.elements from the session ────
    //
    // FPS does not populate `state.floorPlan.document` — its plan lives
    // in the DrawingDocument held by the session registry. The
    // projection thunk (projectFixturesToElements) keeps that
    // DrawingDocument's element stream in sync with
    // `state.fixture.layout.fixtures`. The save therefore reads the
    // element stream from the session's DrawingDocument, not from
    // Redux floorPlan.
    //
    // Reading from Redux floorPlan (as a previous version did) would
    // yield an empty array in FPS, and every save would wipe
    // DrawnWallsJson.elements — losing all walls / doors / windows /
    // rooms / raw geometry / DXF fixtures on the next load.
    //
    // Walls, doors, windows, and room semantic arrays are echoed from
    // the current payload; only `elements` is rebuilt.
    const currentDrawnWalls =
      FixtureDocumentManager.parseJsonSafe(
        currentPayload?.drawnWallsJson ?? currentPayload?.DrawnWallsJson
      ) ?? { walls: [], doors: [], windows: [], elements: [] };

    const session =
      typeof window !== 'undefined'
        ? (window as any).__fixtureSessionRegistry?.get?.(documentId)
        : null;
    const drawingDoc = session?.fixtureDocument?.getDrawingDocument?.();
    const currentElements: any[] = Array.isArray(drawingDoc?.getElements?.())
      ? drawingDoc.getElements()
      : [];

    const rebuiltDrawnWalls = {
      ...currentDrawnWalls,
      elements: currentElements,
    };

    const drawnWallsJson = JSON.stringify(rebuiltDrawnWalls);

    const definedRoomsJson =
      currentPayload?.definedRoomsJson ??
      currentPayload?.DefinedRoomsJson ??
      '[]';

    const pixelsToMetresScale =
      typeof currentPayload?.pixelsToMetresScale === 'number'
        ? currentPayload.pixelsToMetresScale
        : typeof currentPayload?.PixelsToMetresScale === 'number'
          ? currentPayload.PixelsToMetresScale
          : 1.0;

    const savePayload = {
      DrawnWallsJson: drawnWallsJson,
      DefinedRoomsJson: definedRoomsJson,
      PlacedFixturesJson: JSON.stringify(newPlacedFixtures),
      PixelsToMetresScale: pixelsToMetresScale,

      // Server-ignored revision fields — see file header.
      documentId,
      revision: clientRevision,
      expectedRevision: clientRevision,
    };

    // ── Step 4: PUT ───────────────────────────────────────────────────
    try {
      const url = API_ROUTES.PROJECT_EXPLORER_SERVICE.DOCUMENTS.UPDATE(documentId);
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(savePayload),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        return {
          ok: false,
          conflict: false,
          error: `Save failed (${response.status}): ${text}`,
        };
      }

      // ── Step 5: mark clean ──────────────────────────────────────────
      // Do NOT increment the client revision locally. The backend does
      // not yet echo a revision token, so incrementing while the server
      // stays at 0 would make every save after the first report a false
      // conflict. We keep the client at whatever revision it loaded at,
      // and it will match the server's 0 every time.
      //
      // When the backend gains a real revision column, remove this
      // comment and increment locally — the pre-save comparison will
      // begin detecting real concurrent edits.
      fixtureDocument.markSaved(clientRevision);

      return { ok: true, revision: clientRevision };
    } catch (error: any) {
      return {
        ok: false,
        conflict: false,
        error: error?.message ?? 'Save error',
      };
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────

  /**
   * Read a revision from the server's document payload. The backend
   * does not currently expose one; we fall back to 0.
   *
   * When the backend gains a real revision field, only this function
   * needs to change.
   */
  private static readRevisionFromPayload(payload: any): number {
    if (!payload || typeof payload !== 'object') return 0;
    if (typeof payload.revision === 'number') return payload.revision;
    if (typeof payload.Revision === 'number') return payload.Revision;
    return 0;
  }

  private static parseJsonSafe(input: unknown): any {
    if (input == null) return null;
    if (typeof input === 'object') return input;
    if (typeof input !== 'string') return null;
    try {
      return JSON.parse(input);
    } catch {
      return null;
    }
  }
}

export default FixtureDocumentManager;