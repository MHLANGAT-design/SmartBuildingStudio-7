import { useAppSelector } from "@/Application/ConfigureStore";
import { selectMeasurementsVisible } from "@/modules/FloorPlanDesigner/Store/FloorPlanSelectors";
import { formatLength, calculatePolygonArea, EngineeringUnit } from "@/modules/FloorPlanDesigner/Utils/Measurements";
import { Point2D } from "@/modules/FloorPlanDesigner/Utils/CoordinateTransforms";

export function UseMeasurements(preferredUnit: EngineeringUnit = "m", defaultScale: number = 1.0) {
  const measurementsEnabled = useAppSelector(selectMeasurementsVisible);

  const formatDistance = (rawDistance: number, scaleFactor: number = defaultScale): string => {
    if (!measurementsEnabled) return "";
    return formatLength(rawDistance, preferredUnit, scaleFactor);
  };

  const formatArea = (vertices: Point2D[], scaleFactor: number = defaultScale): string => {
    if (!measurementsEnabled || vertices.length < 3) return "0.00 m²";
    const area = calculatePolygonArea(vertices, scaleFactor);
    return `${area.toFixed(2)} m²`;
  };

  return {
    formatDistance,
    formatArea,
    measurementsEnabled,
  };
}
