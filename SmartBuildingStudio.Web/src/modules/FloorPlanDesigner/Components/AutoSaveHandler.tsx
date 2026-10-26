// src/modules/FloorPlanDesigner/Components/AutoSaveHandler.tsx
// ✅ COMPLETE FILE – stops auto‑saving after a failure, no infinite retry

import React, { useEffect, useRef, useState } from "react";
import { UseFloorPlanSaving } from "@/modules/FloorPlanDesigner/Hooks/UseFloorPlanSaving";

export const AutoSaveHandler: React.FC = () => {
  const { saveWorkspaceData, isDirty, isSaving, saveError } = UseFloorPlanSaving();
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Disable auto‑save if there's a persistent error
  useEffect(() => {
    if (saveError) {
      setAutoSaveEnabled(false);
    }
  }, [saveError]);

  // Re‑enable auto‑save when isDirty becomes true again (e.g., after manual save clears error)
  useEffect(() => {
    if (!saveError && isDirty) {
      setAutoSaveEnabled(true);
    }
  }, [saveError, isDirty]);

  useEffect(() => {
    if (!autoSaveEnabled || !isDirty || isSaving) {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
        saveTimeout.current = null;
      }
      return;
    }

    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }

    saveTimeout.current = setTimeout(() => {
      // Double‑check before saving
      if (autoSaveEnabled && isDirty && !isSaving) {
        saveWorkspaceData();
      }
      saveTimeout.current = null;
    }, 1500);

    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
        saveTimeout.current = null;
      }
    };
  }, [isDirty, isSaving, autoSaveEnabled, saveWorkspaceData]);

  return null;
};

export default AutoSaveHandler;