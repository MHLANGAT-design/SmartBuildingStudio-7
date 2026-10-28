// src/modules/Shared/DocumentVersion/selectDocumentFresh.ts

import { createSelector } from '@reduxjs/toolkit';

/**
 * Returns true if `documentId` was loaded at the current global version
 * — meaning no module has saved since this module loaded it, so the
 * data in Redux is up to date.
 *
 * Returns false when:
 *   - The document has never been loaded (no record)
 *   - Another module saved since it was loaded (version mismatch)
 *
 * Modules use this to decide whether to skip a refetch on mount.
 */
export const selectDocumentFresh = (documentId: string) =>
  createSelector(
    [(state: any) => state.documentVersion],
    (dv) => {
      if (!dv) return false;
      const record = dv.loadedDocuments?.[documentId];
      return record != null && record.version === dv.currentVersion;
    }
  );

export const selectCurrentDocumentVersion = (state: any): number =>
  state.documentVersion?.currentVersion ?? 0;