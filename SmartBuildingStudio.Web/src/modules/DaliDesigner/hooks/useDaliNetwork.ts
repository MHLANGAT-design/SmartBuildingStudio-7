import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loadDaliNetwork, saveDaliNetwork } from "@/modules/DaliDesigner/store/daliThunks";
import { selectDocument, selectDirty, selectStatus } from "@/modules/DaliDesigner/store/daliSelectors";

export function useDaliNetwork(projectId: string, floorplanId: string, networkId?: string) {
  const dispatch = useAppDispatch();
  const document = useAppSelector(selectDocument);
  const dirty = useAppSelector(selectDirty);
  const status = useAppSelector(selectStatus);

  useEffect(() => {
    dispatch(loadDaliNetwork({ projectId, floorplanId, networkId }));
  }, [dispatch, projectId, floorplanId, networkId]);

  return {
    document,
    dirty,
    status,
    save: () => dispatch(saveDaliNetwork()),
  };
}