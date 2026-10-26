// src/modules/DaliDesigner/hooks/useLayerVisible.ts
import { useAppSelector } from "@/store/hooks";
import { selectLayerVisibility } from "@/modules/DaliDesigner/store/daliSelectors";
import type { LayerVisibility } from "@/modules/DaliDesigner/store/daliSlice";

export function useLayerVisible(key: keyof LayerVisibility): boolean {
  return useAppSelector(selectLayerVisibility)[key];
}