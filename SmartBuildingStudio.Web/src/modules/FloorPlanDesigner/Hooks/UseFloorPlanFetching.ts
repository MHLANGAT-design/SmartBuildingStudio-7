// src/modules/FloorPlanDesigner/Hooks/UseFloorPlanFetching.ts
//
// This hook no longer fetches anything. The `openDrawing` thunk in
// FloorPlanThunks.ts is the single source of truth for loading the
// document. This hook just reads the Redux state and derives loading
// from whether the document is present.

import { useAppSelector } from '@/Application/ConfigureStore';

export function useFloorPlanFetching() {
  const documentState = useAppSelector(
    (state: any) => state.floorPlan?.document ?? null
  );
  const error = useAppSelector(
    (state: any) => state.floorPlan?.error ?? null
  );

  const urlParams =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const urlId = urlParams.get('documentId') || urlParams.get('id');

  const activeDocumentId =
    urlId || documentState?.id || (window as any).__activeDocumentId;

  // Derived loading: nothing is loading once the document with an id
  // exists in Redux, or an error is present.
  const isLoading = !documentState?.id && !error;

  return {
    documentId: activeDocumentId,
    isLoading,
    error,
    activeDocumentState: documentState,
  };
}

export default useFloorPlanFetching;