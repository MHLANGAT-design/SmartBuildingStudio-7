// src/modules/Shared/DocumentVersion/saveWithVersionBump.ts

import { createAsyncThunk } from '@reduxjs/toolkit';
import { ThunkApiConfig } from '@/Application/ConfigureStore';
import { bumpDocumentVersion } from '@/modules/Shared/DocumentVersion/documentVersionSlice';

/**
 * Wrap any save operation so that, on success, the global document
 * version counter increments. Any other module with a stale load
 * record will then refetch on its next mount.
 *
 * Usage:
 *   dispatch(saveWithVersionBump({
 *     saver: () => dispatch(saveEmergencyRoutes()).unwrap(),
 *     label: 'emergency-routes',
 *   }));
 *
 * The wrapper is intentionally thin — it just calls `saver()` and
 * bumps the counter on success. If `saver()` throws or rejects, the
 * counter is not bumped and the error propagates unchanged.
 *
 * `label` is optional and appears only in DevTools (useful when
 * multiple save paths exist in the same module).
 */
export const saveWithVersionBump = createAsyncThunk<
  any,
  { saver: () => Promise<any>; label?: string },
  ThunkApiConfig
>('shared/saveWithVersionBump', async ({ saver }, { dispatch }) => {
  const result = await saver();
  dispatch(bumpDocumentVersion());
  return result;
});