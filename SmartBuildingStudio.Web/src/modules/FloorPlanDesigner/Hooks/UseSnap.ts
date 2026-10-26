import { useAppSelector } from "@/Application/ConfigureStore";
import { selectViewport, selectSnapVisible, selectGridVisible } from "@/modules/FloorPlanDesigner/Store/FloorPlanSelectors";
import { Point2D, screenToWorld } from "@/modules/FloorPlanDesigner/Utils/CoordinateTransforms";

export function UseSnap(gridSizePixels: number = 20) {
  const viewport = useAppSelector(selectViewport);
  const snapVisible = useAppSelector(selectSnapVisible);
  const gridVisible = useAppSelector(selectGridVisible);

  const snapToGrid = (point: Point2D): Point2D => {
    if (!snapVisible || !gridVisible) return point;
    return {
      x: Math.round(point.x / gridSizePixels) * gridSizePixels,
      y: Math.round(point.y / gridSizePixels) * gridSizePixels,
    };
  };

  const resolvePosition = (screenPoint: Point2D): Point2D => {
    const worldPoint = screenToWorld(screenPoint, viewport);
    return snapToGrid(worldPoint);
  };

  return {
    snapToGrid,
    resolvePosition,
    snapEnabled: snapVisible,
  };
}
