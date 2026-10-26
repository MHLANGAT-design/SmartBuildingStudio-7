// src/modules/FixturePlacementStudio/Document/FixtureVersionManager.ts
//
// Tracks document revisions and exposes staleness checks.
//
// v1.0 uses client-side revision tracking: the client increments its own
// revision on each successful save. The backend does not yet expose a
// revision, so FixtureVersionManager is thin — its job is to hold the
// currently-loaded revision, expose it to callers, and provide a single
// place to swap in server-side revision handling when the backend gains
// that capability.
//
// This class is a session object, not a store. The store calls into it
// via actions/thunks; it does not read Redux directly.

import type { FixtureDocument } from '@/modules/FixturePlacementStudio/Document/FixtureDocument';

export interface VersionState {
  documentId: string;
  /** The revision this session loaded at. */
  loadedRevision: number;
  /** The revision we consider current after any successful saves. */
  currentRevision: number;
  /** ISO timestamp of the last successful save, if any. */
  lastSavedAt?: string;
  /** True between markStale() and the next successful save or reload. */
  stale: boolean;
}

export class FixtureVersionManager {
  private _state: VersionState;

  constructor(documentId: string, loadedRevision: number) {
    this._state = {
      documentId,
      loadedRevision,
      currentRevision: loadedRevision,
      stale: false,
    };
  }

  // ─── Accessors ───────────────────────────────────────────────────────

  getState(): VersionState {
    return { ...this._state };
  }

  getLoadedRevision(): number {
    return this._state.loadedRevision;
  }

  getCurrentRevision(): number {
    return this._state.currentRevision;
  }

  isStale(): boolean {
    return this._state.stale;
  }

  // ─── Mutations ───────────────────────────────────────────────────────

  /**
   * Mark the session as having loaded a new revision (e.g. after a
   * reload from the server). Resets staleness.
   */
  reload(loadedRevision: number): void {
    this._state = {
      ...this._state,
      loadedRevision,
      currentRevision: loadedRevision,
      stale: false,
    };
  }

  /**
   * Record a successful save. The client increments its own revision
   * (Option A: client is the source of truth until the server tracks
   * revisions). Clears staleness.
   */
  recordSave(newRevision: number): void {
    this._state = {
      ...this._state,
      currentRevision: newRevision,
      lastSavedAt: new Date().toISOString(),
      stale: false,
    };
  }

  /**
   * Called when the pre-save conflict check finds a revision mismatch.
   * Marks the session stale so the UI can surface "the server has a
   * newer version" and offer overwrite/reload/cancel.
   */
  markStale(): void {
    this._state = { ...this._state, stale: true };
  }

  // ─── Integration with FixtureDocument ────────────────────────────────

  /**
   * Sync from a FixtureDocument. Useful when the document is passed
   * around (undo, dialogs) and the version manager is downstream.
   */
  syncFrom(fixtureDocument: FixtureDocument): void {
    this._state = {
      ...this._state,
      documentId: fixtureDocument.getDocumentId(),
      currentRevision: fixtureDocument.getRevision(),
    };
  }
}

export default FixtureVersionManager;