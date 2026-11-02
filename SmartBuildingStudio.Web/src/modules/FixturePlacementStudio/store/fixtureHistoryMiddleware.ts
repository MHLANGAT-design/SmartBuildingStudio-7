// src/modules/FixturePlacementStudio/store/fixtureHistoryMiddleware.ts
//
// Redux middleware that records layout snapshots into the
// FixtureHistory instance stored in the SessionRegistry.
//
// Undo/Redo buttons read from that history. Without this middleware,
// the undo stack stays empty — FixtureHistory has no automatic hook
// into the Redux store, and the mutation reducers themselves don't
// push snapshots.
//
// Behaviour:
//
//   • After a mutation action runs, if the layout changed, push the
//     new layout onto the history.
//
//   • "Changed" is decided by identity comparison. The slice reducers
//     use immutable updates via FixturePlacementService, so a real
//     mutation produces a new layout object. A no-op (e.g. delete of
//     an id that isn't in the layout) leaves the reference untouched,
//     and we skip the push.
//
//   • We deliberately do NOT push for setLayout itself. That action is
//     what Undo/Redo use to restore a previous snapshot — pushing
//     would corrupt the stack. Other excluded actions are listed
//     below; they don't mutate the layout.
//
// Concurrency: this middleware reads the current layout from
// getState() after next(action), which is the post-reducer state.

import type { Middleware } from '@reduxjs/toolkit';
import type { RootState } from '@/Application/ConfigureStore';
import { SessionRegistry } from '@/modules/FixturePlacementStudio/store/SessionRegistry';

// ─── Action types that mutate the layout ──────────────────────────────────────

const MUTATION_LABELS: Record<string, string> = {
  'fixture/placeFixture': 'Place fixture',
  'fixture/moveFixtures': 'Move fixtures',
  'fixture/setFixturePositionAndRoom': 'Move fixture',
  'fixture/repositionFixtures': 'Reposition fixtures',
  'fixture/rotateFixtures': 'Rotate fixtures',
  'fixture/deleteFixtures': 'Delete fixtures',
  'fixture/mergeFixtures': 'Import fixtures',
  'fixture/createZone': 'Create zone',
  'fixture/addFixturesToZone': 'Add to zone',
  'fixture/removeFixturesFromZone': 'Remove from zone',
  'fixture/deleteZones': 'Delete zones',
};

// ─── Middleware ───────────────────────────────────────────────────────────────

export const fixtureHistoryMiddleware: Middleware<{}, RootState> =
  (store) => (next) => (action: any) => {
    const type: string | undefined = action?.type;
    const isMutation = type != null && type in MUTATION_LABELS;

    // Capture the layout reference *before* the reducer runs, so we can
    // tell whether the reducer actually produced a new object.
    const beforeLayout = store.getState().fixture.layout;

    const result = next(action);

    if (!isMutation) return result;

    const state = store.getState();
    const afterLayout = state.fixture.layout;
    const documentId = state.fixture.documentId;

    // No layout, or no document session → nothing to record.
    if (!afterLayout || !documentId) return result;

    // Reducer no-op: same reference means nothing changed.
    if (afterLayout === beforeLayout) return result;

    const session = SessionRegistry.get(documentId);
    if (!session?.history) return result;

    try {
      session.history.push(
        {
          fixtures: afterLayout.fixtures,
          zones: afterLayout.zones,
          label: MUTATION_LABELS[type],
        },
        MUTATION_LABELS[type]
      );
    } catch (err) {
      // Never let history bookkeeping break the app.
      // eslint-disable-next-line no-console
      console.warn('[fixtureHistoryMiddleware] Failed to push snapshot:', err);
    }

    return result;
  };

export default fixtureHistoryMiddleware;