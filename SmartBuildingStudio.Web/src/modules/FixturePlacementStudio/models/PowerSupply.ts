// src/modules/FixturePlacementStudio/models/PowerSupply.ts
//
// Kind-specific payload for a power supply unit instance.
//
// A power supply converts mains AC to a DC rail that feeds drivers or
// luminaires directly. Distinct from a driver: the driver regulates
// current to the LED; the supply provides the upstream DC bus. Per-instance
// data only — rated power, efficiency class, and IP rating come from the
// catalog.

export type PowerSupplyType = 'AC-DC' | 'DC-DC' | 'UPS' | 'battery' | 'unknown';

export type IPRating = 'IP20' | 'IP44' | 'IP54' | 'IP65' | 'IP67' | 'unknown';

export interface PowerSupply {
  /** Supply topology. */
  supplyType?: PowerSupplyType;

  /** Rated DC output voltage (e.g. 24, 48). */
  outputVoltage?: number;

  /** Rated DC output current in amps. */
  outputCurrentA?: number;

  /** Rated output power in watts. */
  powerRatingW?: number;

  /** Environmental ingress protection rating. */
  ipRating?: IPRating;

  /** Free-form per-instance override of catalog defaults. */
  overrides?: Record<string, unknown>;
}

export default PowerSupply;