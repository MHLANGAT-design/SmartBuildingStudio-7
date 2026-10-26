import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectScenes } from "@/modules/DaliDesigner/store/daliSelectors";
import { createScene } from "@/modules/DaliDesigner/store/daliSlice";

export function useScenes() {
  const dispatch = useAppDispatch();
  const scenes = useAppSelector(selectScenes);
  return {
    scenes,
    create: (name: string) => dispatch(createScene({ name })),
  };
}