// src/modules/FixturePlacementStudio/Document/FixtureHistory.ts
//
// Bounded undo/redo for fixture and zone operations.
//
// History is SESSION-ONLY. It is not persisted, and it does not survive
// a page reload. When the user reloads the document, the stack is
// cleared — undo/redo across a load boundary would be ambiguous
// (what exactly would "undo" restore, given the document may have
// changed on the server?).
//
// Design notes:
//   - The history stores *snapshots* of the FixtureLayout's persistable
//     subset (fixtures + zones). This is simple and robust. Delta-based
//     history is smaller but requires every mutation to correctly
//     produce an inverse, which is easy to get wrong.
//   - The bound is a fixed count (default 50). When exceeded, the oldest
//     entry is dropped.
//   - FixtureHistory does NOT dispatch to Redux. It returns the state
//     that should be applied; the caller dispatches. This keeps the
//     history decoupled from the store and testable in isolation.

import type { Fixture } from '@/modules/FixturePlacementStudio/models/Fixture';
import type { Zone } from '@/modules/FixturePlacementStudio/models/Zone';

// ─── Snapshot ─────────────────────────────────────────────────────────────────

export interface LayoutSnapshot {
  fixtures: Fixture[];
  zones: Zone[];
  /** Free-form label for UI tooltips ("Add luminaire", "Delete zone"). */
  label?: string;
}

// ─── History ──────────────────────────────────────────────────────────────────

const DEFAULT_LIMIT = 50;

export class FixtureHistory {
  private undoStack: LayoutSnapshot[] = [];
  private redoStack: LayoutSnapshot[] = [];
  private currentSnapshot: LayoutSnapshot;
  private readonly limit: number;

  constructor(initial: LayoutSnapshot, limit = DEFAULT_LIMIT) {
    this.currentSnapshot = FixtureHistory.clone(initial);
    this.limit = limit;
  }

  /**
   * Record a new state. Callers pass the *new* state after the operation
   * completes. The current snapshot is pushed onto the undo stack, and
   * the redo stack is cleared.
   */
  push(newState: LayoutSnapshot, label?: string): void {
    this.undoStack.push(this.currentSnapshot);
    if (this.undoStack.length > this.limit) {
      this.undoStack.shift();
    }
    this.currentSnapshot = FixtureHistory.clone({ ...newState, label });
    this.redoStack = [];
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  undo(): LayoutSnapshot | null {
    if (this.undoStack.length === 0) return null;
    this.redoStack.push(this.currentSnapshot);
    const restored = this.undoStack.pop()!;
    this.currentSnapshot = restored;
    return FixtureHistory.clone(restored);
  }

  redo(): LayoutSnapshot | null {
    if (this.redoStack.length === 0) return null;
    this.undoStack.push(this.currentSnapshot);
    const restored = this.redoStack.pop()!;
    this.currentSnapshot = restored;
    return FixtureHistory.clone(restored);
  }

  /**
   * Reset the history to a new baseline. Called when a document is
   * (re)loaded or saved and the session continues.
   */
  reset(baseline: LayoutSnapshot): void {
    this.undoStack = [];
    this.redoStack = [];
    this.currentSnapshot = FixtureHistory.clone(baseline);
  }

  /** Current head of history. */
  peek(): LayoutSnapshot {
    return FixtureHistory.clone(this.currentSnapshot);
  }

  private static clone(snap: LayoutSnapshot): LayoutSnapshot {
    // Shallow-clone the top-level arrays and the entries within. Entries
    // are structurally shared with the caller's state; mutations must
    // produce new objects (immutable update), so sharing is safe.
    return {
      fixtures: snap.fixtures.map((f) => ({ ...f })),
      zones: snap.zones.map((z) => ({ ...z })),
      label: snap.label,
    };
  }
}

export default FixtureHistory;