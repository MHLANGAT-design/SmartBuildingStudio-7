// src/modules/FloorPlanDesigner/Hooks/UseFloorPlanSaving.ts

import { useCallback, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/Application/ConfigureStore";
import { saveDrawing } from "@/modules/FloorPlanDesigner/Store/FloorPlanThunks";
import { markClean, setError } from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";
import { store } from "@/Application/ConfigureStore";

export function UseFloorPlanSaving() {
  const dispatch = useAppDispatch();
  const [saveError, setSaveError] = useState<string | null>(null);

  const isSaving = useAppSelector((state: any) => state.floorPlan?.isSaving || false);
  const isDirty = useAppSelector((state: any) => state.floorPlan?.isDirty || false);

  const saveWorkspaceData = useCallback(async () => {
    setSaveError(null);
    dispatch(setError(null));

    const document = store.getState().floorPlan?.document;

    if (!document) {
      setSaveError("No document in Redux");
      return;
    }
    if (!document.id) {
      setSaveError("No document ID, cannot save");
      return;
    }
    if (isSaving) {
      return;
    }

    try {
      await dispatch(saveDrawing(document.id)).unwrap();
      dispatch(markClean());
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Save failed";
      setSaveError(msg);
      dispatch(setError(msg));
    }
  }, [dispatch, isSaving]);

  return {
    isSaving,
    isDirty,
    saveWorkspaceData,
    saveError,
    clearSaveError: () => setSaveError(null),
  };
}

export default UseFloorPlanSaving;