// src/modules/FixturePlacementStudio/models/Sensor.ts
//
// Kind-specific payload for a sensor fixture instance.
//
// Sensors include occupancy detectors, daylight sensors, and combined
// units. The product definition (coverage pattern, protocol, range)
// comes from ProductCatalogService. This payload carries only per-instance
// data.

export type SensorType =
  | 'occupancy'
  | 'vacancy'
  | 'daylight'
  | 'combined'
  | 'temperature'
  | 'unknown';

export type SensorMounting = 'ceiling' | 'wall' | 'corner' | 'high-bay' | 'unknown';

export interface Sensor {
  /** Sensor modality. May refine or override catalog default. */
  sensorType?: SensorType;

  /** Physical mounting style for this instance. */
  mounting?: SensorMounting;

  /**
   * Coverage radius in meters at the installed height. Optional — if
   * omitted, the coverage circle uses the catalog default scaled by
   * Fixture.elevation.
   */
  coverageRadius?: number;

  /**
   * Detection sensitivity / threshold. 0..1 range. Rendering uses this
   * only for visualization; the value itself is passed through to the
   * control system on export.
   */
  sensitivity?: number;

  /** Free-form per-instance override of catalog defaults. */
  overrides?: Record<string, unknown>;
}

export default Sensor;