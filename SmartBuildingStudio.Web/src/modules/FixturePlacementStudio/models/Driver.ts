// src/modules/FixturePlacementStudio/models/Driver.ts
//
// Kind-specific payload for an LED driver instance.
//
// A driver is the power-electronics module that sits between mains (or a
// power supply) and one or more luminaires. It has its own dimming and
// control semantics. Per the studio's model: anything from the catalog
// (rated current, supported protocol, efficiency) lives in
// ProductCatalogService and is looked up by productId — only per-instance
// differences belong here.

export type DriverProtocol = 'DALI' | 'DALI-2' | '0-10V' | 'DMX' | 'KNX' | 'mains' | 'unknown';

export type DriverMounting = 'integrated' | 'remote' | 'rail' | 'panel' | 'unknown';

export interface Driver {
  /** Control protocol this driver uses. May override catalog default. */
  protocol?: DriverProtocol;

  /** Physical mounting style. */
  mounting?: DriverMounting;

  /** Number of independently controllable channels. */
  channelCount?: number;

  /** Whether the driver supports dimming. */
  dimmable?: boolean;

  /** Output current in milliamps (e.g. 350, 700, 1050). */
  outputCurrentMa?: number;

  /** Per-instance channel-to-luminaire mapping (channel index → fixture ids). */
  channelAssignments?: Record<number, string[]>;

  /** Free-form per-instance override of catalog defaults. */
  overrides?: Record<string, unknown>;
}

export default Driver;