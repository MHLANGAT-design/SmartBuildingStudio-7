// src/modules/FixturePlacementStudio/store/SessionRegistry.ts
//
// A module-level registry mapping documentId → live session objects.
//
// Why this exists:
//   The Redux store holds only serializable data. But FixtureDocument
//   and FixtureHistory are class instances with methods, and we do not
//   want to put them in Redux (the serializable check would fail, and
//   they'd be fragile under devtools time-travel).
//
//   The slice stores documentId. Callers that need the class instances
//   look them up here. Mutations still flow through Redux; the registry
//   holds references, not state.
//
// Lifecycle:
//   - loadDocumentThunk registers a session on successful load.
//   - saveDocumentThunk reads the FixtureDocument and updates revision.
//   - The FixturePlacementStudioPage unmount hook calls dispose().

import type { FixtureDocument } from '@/modules/FixturePlacementStudio/Document/FixtureDocument';
import type { FixtureHistory } from '@/modules/FixturePlacementStudio/Document/FixtureHistory';

export interface FixtureSession {
  fixtureDocument: FixtureDocument;
  history: FixtureHistory;
}

const registry = new Map<string, FixtureSession>();

export const SessionRegistry = {
  register(documentId: string, session: FixtureSession): void {
    // Dispose any prior session for the same id — shouldn't happen, but
    // if it does we want the old one torn down.
    const existing = registry.get(documentId);
    if (existing && existing !== session) {
      try {
        existing.fixtureDocument.dispose();
      } catch {
        // Dispose is best-effort. Ignore errors.
      }
    }
    registry.set(documentId, session);
  },

  get(documentId: string): FixtureSession | undefined {
    return registry.get(documentId);
  },

  dispose(documentId: string): void {
    const session = registry.get(documentId);
    if (!session) return;
    try {
      session.fixtureDocument.dispose();
    } catch {
      // Best-effort.
    }
    registry.delete(documentId);
  },

  clear(): void {
    for (const [id] of registry) {
      SessionRegistry.dispose(id);
    }
  },

  listDocumentIds(): string[] {
    return Array.from(registry.keys());
  },
};

export default SessionRegistry;