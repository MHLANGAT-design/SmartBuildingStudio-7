// src/modules/FixturePlacementStudio/Document/FixtureDocument.ts
//
// FixtureDocument wraps a loaded DrawingDocument for a single editing
// session in FixturePlacementStudio.
//
// It owns:
//   - a reference to the loaded DrawingDocument (background geometry)
//   - the FixtureLayout being edited (fixtures + zones + session state)
//   - the revision token for conflict detection
//
// It does NOT own persistence — FixtureDocumentManager handles load and
// save. It does NOT own undo/redo — FixtureHistory handles that.
// It DOES own the in-memory consistency of layout vs document: the two
// must never diverge silently.

import type { DrawingDocument } from '@/modules/FloorPlanDesigner/Document/DrawingDocument';
import type { FixtureLayout } from '@/modules/FixturePlacementStudio/models/FixtureLayout';
import { createEmptyLayout } from '@/modules/FixturePlacementStudio/models/FixtureLayout';

export interface FixtureDocumentOptions {
  /** The loaded background document. Required. */
  drawingDocument: DrawingDocument;
  /** The revision we loaded at. Used for conflict detection on save. */
  revision: number;
}

export class FixtureDocument {
  private _drawingDocument: DrawingDocument;
  private _layout: FixtureLayout;
  private _revision: number;
  private _dirty: boolean;

  constructor(options: FixtureDocumentOptions) {
    this._drawingDocument = options.drawingDocument;
    this._revision = options.revision;
    this._dirty = false;

    const docId = this._drawingDocument.getId();
    this._layout = createEmptyLayout({
      documentId: docId,
      revision: options.revision,
    });
  }

  // ─── Identity ────────────────────────────────────────────────────────

  getDocumentId(): string {
    return this._drawingDocument.getId();
  }

  getDrawingDocument(): DrawingDocument {
    return this._drawingDocument;
  }

  getRevision(): number {
    return this._revision;
  }

  // ─── Layout ──────────────────────────────────────────────────────────

  getLayout(): FixtureLayout {
    return this._layout;
  }

  /**
   * Replace the layout wholesale. Used after deserialization, after a
   * reload from the server, or after an undo that restored a full
   * snapshot. Does NOT mark the document dirty by itself — callers
   * decide whether the replacement counts as a change.
   */
  setLayout(layout: FixtureLayout): void {
    this._layout = layout;
  }

  // ─── Dirty flag ──────────────────────────────────────────────────────

  isDirty(): boolean {
    return this._dirty;
  }

  markDirty(): void {
    this._dirty = true;
    this._layout = { ...this._layout, dirty: true };
  }

  /**
   * Called by FixtureDocumentManager after a successful save. Sets
   * revision to the new value and clears the dirty flag.
   */
  markSaved(newRevision: number): void {
    this._revision = newRevision;
    this._dirty = false;
    this._layout = { ...this._layout, revision: newRevision, dirty: false };
  }

  // ─── Mutations ───────────────────────────────────────────────────────

  /**
   * Convenience: replace the layout's fixtures and mark dirty in one
   * step. Most callers should prefer this over setLayout + markDirty
   * so the flag can't be forgotten.
   */
  updateFixtures(fixtures: FixtureLayout['fixtures']): void {
    this._layout = { ...this._layout, fixtures };
    this.markDirty();
  }

  updateZones(zones: FixtureLayout['zones']): void {
    this._layout = { ...this._layout, zones };
    this.markDirty();
  }

  // ─── Teardown ────────────────────────────────────────────────────────

  /**
   * Called when the user leaves the workspace. Frees references so the
   * layout and drawing document can be garbage-collected. After this,
   * the instance should not be used.
   */
  dispose(): void {
    this._layout = createEmptyLayout({
      documentId: this._drawingDocument.getId(),
      revision: this._revision,
    });
    this._dirty = false;
  }
}

export default FixtureDocument;