// src/modules/FixturePlacementStudio/store/projectFixturesThunk.ts
//
// Projects the current FPS fixture layout into BOTH:
//   1. the session's DrawingDocument (the render source for FPS's
//      FixtureCanvas — updates live on every mutation)
//   2. Redux `floorPlan.document.elements` (the render source for FPD
//      and DaliDesigner, and the source FixtureDocumentManager.save
//      uses when rebuilding DrawnWallsJson)
//
// Both targets are kept in sync with `state.fixture.layout.fixtures`,
// which is the authoritative fixture population. The projection is
// idempotent — running it with the current layout produces the same
// state as the last run — so it's safe to fire on every mutation.
//
// FPS-owned fixtures (`fx-*`) are removed and re-added; everything
// else in the element stream (walls, doors, windows, rooms, raw
// geometry, DXF placeholder fixtures `py_fixture_*`) passes through.

import { setDocument } from '@/modules/FloorPlanDesigner/Store/FloorPlanSlice';
import type { Fixture } from '@/modules/FixturePlacementStudio/models/Fixture';

function isFpsFixtureId(id: string): boolean {
  return id.startsWith('fx-');
}

function projectFixtureElements(fixtures: Fixture[], existingElements: any[]): any[] {
  const withoutFpsFixtures = existingElements.filter((el: any) => {
    const id = String(el?.id ?? '');
    return !id || !isFpsFixtureId(id);
  });

  const projectedFixtures = fixtures.map((f) => {
    const x = Number(f.x ?? 0);
    const y = Number(f.y ?? 0);
    return {
      id: String(f.id),
      type: 'fixture',
      kind: String(f.kind ?? 'luminaire'),
      fixtureType: String(f.kind ?? 'luminaire'),
      isFixture: true,
      x,
      y,
      points: [{ x, y }],
      vertices: [{ x, y }],
      rotation: Number(f.rotation ?? 0),
      productId: f.productId,
      roomId: f.roomId,
      elevation: f.elevation,
      layer: 'fixtures',
      originalLayer: 'fixtures',
    };
  });

  return [...withoutFpsFixtures, ...projectedFixtures];
}

export const projectFixturesToElements =
  (fixtures: Fixture[]) =>
  (dispatch: any, getState: () => any) => {
    // ── 1. Project into the FPS session's DrawingDocument ───────────
    //
    // FPS's canvas reads from this DrawingDocument via
    // drawingDocument.getElements(). The projection must land here
    // so live mutations (place / move / delete) show on the canvas
    // without waiting for a save+reload cycle.
    const fixtureState = getState().fixture;
    const documentId = fixtureState?.layout?.documentId;

    if (documentId) {
      const reg = (window as any).__fixtureSessionRegistry;
      const session = reg?.get?.(documentId);
      const fixtureDocument = session?.fixtureDocument;
      const drawingDocument = fixtureDocument?.getDrawingDocument?.();

      if (drawingDocument) {
        const currentElements = drawingDocument.getElements?.() || [];
        const projected = projectFixtureElements(fixtures, currentElements);
        try {
          drawingDocument.loadFromState({
            elements: projected,
            walls: drawingDocument.getWalls?.() || [],
            doors: drawingDocument.getDoors?.() || [],
            windows: drawingDocument.getWindows?.() || [],
            rooms: drawingDocument.getRooms?.() || [],
          });
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn(
            '[projectFixturesToElements] DrawingDocument update failed',
            e
          );
        }
      }
    }

    // ── 2. Project into Redux floorPlan for FPD / DaliDesigner ─────
    //
    // FPD and DaliDesigner read from `state.floorPlan.document.elements`.
    // Projecting there keeps the two views in sync when the user
    // transitions back to FPD or DaliDesigner.
    //
    // If FPS's floorPlan.document is empty (which is the normal state
    // — FPS doesn't populate floorPlan), this dispatch is skipped.
    // The DrawingDocument update above is what FPS needs; cross-module
    // sync happens on the next save via FixtureDocumentManager.save,
    // which reads from the session's DrawingDocument.
    const doc = getState().floorPlan?.document;
    if (doc && Array.isArray(doc.elements)) {
      const projected = projectFixtureElements(fixtures, doc.elements);
      dispatch(setDocument({ ...doc, elements: projected }));
    }
  };

export default projectFixturesToElements;