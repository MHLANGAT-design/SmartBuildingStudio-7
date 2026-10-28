// src/modules/Shared/DocumentVersion/documentVersionSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface LoadedDocumentRecord {
  version: number;
  loadedAt: string;
}

interface DocumentVersionState {
  currentVersion: number;
  loadedDocuments: Record<string, LoadedDocumentRecord>;
}

const initialState: DocumentVersionState = {
  currentVersion: 0,
  loadedDocuments: {},
};

const documentVersionSlice = createSlice({
  name: 'documentVersion',
  initialState,
  reducers: {
    bumpDocumentVersion(state) {
      state.currentVersion += 1;
    },
    recordDocumentLoaded(
      state,
      action: PayloadAction<{ documentId: string; version: number }>
    ) {
      state.loadedDocuments[action.payload.documentId] = {
        version: action.payload.version,
        loadedAt: new Date().toISOString(),
      };
    },
    clearDocumentRecord(state, action: PayloadAction<string>) {
      delete state.loadedDocuments[action.payload];
    },
    resetAllRecords(state) {
      state.loadedDocuments = {};
    },
  },
});

export const {
  bumpDocumentVersion,
  recordDocumentLoaded,
  clearDocumentRecord,
  resetAllRecords,
} = documentVersionSlice.actions;

export default documentVersionSlice.reducer;