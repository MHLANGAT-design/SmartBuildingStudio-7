import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectGroups } from "@/modules/DaliDesigner/store/daliSelectors";
import { createGroup } from "@/modules/DaliDesigner/store/daliSlice";

export function useGroups() {
  const dispatch = useAppDispatch();
  const groups = useAppSelector(selectGroups);
  return {
    groups,
    create: (name: string, deviceIds: string[]) =>
      dispatch(createGroup({ name, deviceIds })),
  };
}