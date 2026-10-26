import { CoordinateSystem } from "@/modules/FloorPlanDesigner/Spatial/CoordinateSystem";
import { SpatialBounds } from "@/modules/FloorPlanDesigner/Spatial/SpatialBounds";

export enum SpatialUnits {
  Millimetres,
  Centimetres,
  Metres,
  Inches,
  Feet
}

export class SpatialReference {
  constructor(
    public readonly coordinateSystem: CoordinateSystem,
    public readonly bounds: SpatialBounds,
    public readonly units: SpatialUnits = SpatialUnits.Millimetres
  ) {}

  public clone(): SpatialReference {
    return new SpatialReference(
      this.coordinateSystem.clone(),
      this.bounds.clone(),
      this.units
    );
  }
}
