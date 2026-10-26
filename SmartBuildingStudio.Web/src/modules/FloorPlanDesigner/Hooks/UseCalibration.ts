import { useState } from "react";
import { useAppSelector } from "@/Application/ConfigureStore";
import { selectViewport } from "@/modules/FloorPlanDesigner/Store/FloorPlanSelectors";
import { Point2D, screenToWorld } from "@/modules/FloorPlanDesigner/Utils/CoordinateTransforms";
import { getDistance } from "@/modules/FloorPlanDesigner/Utils/Geometry";
import { UseUtmCoordinateBridge, UtmBounds } from "@/modules/FloorPlanDesigner/Hooks/UseUtmCoordinateBridge";

export function UseCalibration(bounds: UtmBounds | null) {
  const viewport = useAppSelector(selectViewport);
  
  // Initialize our unified local transform bridge
  const { toLocalSpace, toAbsoluteUtm } = UseUtmCoordinateBridge(bounds);

  // Keep state matrices small and normalized to avoid rounding errors during click/drag actions
  const [startPoint, setStartPoint] = useState<Point2D | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point2D | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);

  const startCalibration = (screenPoint: Point2D) => {
    const rawWorldPoint = screenToWorld(screenPoint, viewport);
    
    // Shift the global absolute point down into precision local boundary offsets
    const localPoint = toLocalSpace(rawWorldPoint.x, rawWorldPoint.y);
    
    setStartPoint(localPoint);
    setCurrentPoint(localPoint);
    setIsCalibrating(true);
  };

  const updateCalibrationVector = (screenPoint: Point2D) => {
    if (!isCalibrating) return;
    const rawWorldPoint = screenToWorld(screenPoint, viewport);
    
    const localPoint = toLocalSpace(rawWorldPoint.x, rawWorldPoint.y);
    setCurrentPoint(localPoint);
  };

  // Computes pixel distances accurately since the inputs operate around a localized (0,0) center
  const getPixelDistance = (): number => {
    if (!startPoint || !currentPoint) return 0;
    return getDistance(startPoint, currentPoint);
  };

  const clearCalibration = () => {
    setStartPoint(null);
    setCurrentPoint(null);
    setIsCalibrating(false);
  };

  // Re-inflate coordinates back to raw georeferenced values only when outputting text to UI labels
  const utmStartPoint = startPoint ? toAbsoluteUtm(startPoint.x, startPoint.y) : null;
  const utmCurrentPoint = currentPoint ? toAbsoluteUtm(currentPoint.x, currentPoint.y) : null;

  return {
    isCalibrating,
    startPoint,       
    currentPoint,     
    utmStartPoint,    
    utmCurrentPoint,  
    startCalibration,
    updateCalibrationVector,
    getPixelDistance,
    clearCalibration,
  };
}