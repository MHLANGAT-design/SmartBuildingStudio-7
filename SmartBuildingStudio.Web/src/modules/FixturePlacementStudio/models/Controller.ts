// src/modules/FixturePlacementStudio/models/Controller.ts
//
// Kind-specific payload for a lighting controller instance.
//
// Controllers are logic devices that orchestrate luminaires, sensors, and
// switches on a lighting network. Distinct from a gateway (which is a
// protocol bridge): a controller runs application logic — occupancy
// response, daylight harvesting, time schedules. Per-instance data only.

export type ControllerProtocol = 'DALI' | 'DALI-2' | 'KNX' | 'BACnet' | 'Modbus' | 'proprietary' | 'unknown';

export type ControllerApplicationType =
  | 'occupancy'
  | 'daylight-harvesting'
  | 'time-schedule'
  | 'scene'
  | 'combined'
  | 'unknown';

export interface Controller {
  /** Network protocol this controller speaks. */
  protocol?: ControllerProtocol;

  /** Primary application role. */
  applicationType?: ControllerApplicationType;

  /** Maximum number of downstream devices the controller can address. */
  maxDevices?: number;

  /** Controller's network address on its bus. */
  address?: string;

  /** Free-form per-instance override of catalog defaults. */
  overrides?: Record<string, unknown>;
}

export default Controller;