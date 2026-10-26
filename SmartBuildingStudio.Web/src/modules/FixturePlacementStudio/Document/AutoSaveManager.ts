// src/modules/FixturePlacementStudio/Document/AutoSaveManager.ts
//
// AutoSaveManager is a NO-OP placeholder in v1.0.
//
// Auto-save is deliberately disabled until the backend supports
// revision-based optimistic concurrency. Without that, every autosave
// is a potential silent overwrite of the other editor's changes, which
// is worse than a missing save.
//
// This file exists so the wiring is present when autosave is enabled:
//   - callers already invoke scheduleAutoSave() after mutations
//   - enabling autosave becomes a one-line change here
//   - no callers need to change when it's turned on
//
// When we're ready for v1.1:
//   1. Add a real backend concurrency check (server-side revision).
//   2. Replace the body of scheduleAutoSave() with a debounced call to
//      FixtureDocumentManager.save().
//   3. Add a cancel() call in the "document closed" path.

export interface AutoSaveOptions {
  /** Debounce interval in ms. Ignored while disabled. */
  debounceMs?: number;
  /** Called after a successful autosave. Ignored while disabled. */
  onSaved?: (revision: number) => void;
  /** Called when autosave encounters an error. Ignored while disabled. */
  onError?: (error: string) => void;
}

export class AutoSaveManager {
  /**
   * Records that the document has been modified. In v1.0 this does
   * nothing — the dirty flag on FixtureDocument is the only tracking we
   * do. Callers may safely call this after every mutation.
   */
  static scheduleAutoSave(_options?: AutoSaveOptions): void {
    // Intentionally empty. See file header for the v1.1 plan.
  }

  /**
   * Cancel any pending autosave. In v1.0 there is nothing to cancel, but
   * callers should call this in the "document closed" path so the call
   * site doesn't need to change when autosave is enabled.
   */
  static cancel(): void {
    // Intentionally empty.
  }

  /**
   * Whether autosave is currently active. Always false in v1.0. Useful
   * for the UI to hide/show an "Auto-saving…" indicator without knowing
   * the version policy.
   */
  static isEnabled(): boolean {
    return false;
  }
}

export default AutoSaveManager;