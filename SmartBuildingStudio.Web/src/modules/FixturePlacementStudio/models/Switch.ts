// src/modules/FixturePlacementStudio/models/Switch.ts
//
// Kind-specific payload for a switch instance.
//
// Physical switches — wall-mounted, pushbutton, rocker, rotary, or
// momentary. Includes manual controls on a lighting bus (DALI pushbuttons,
// KNX wall switches). Per-instance data only.

export type SwitchType = 'pushbutton' | 'rocker' | 'rotary' | 'momentary' | 'toggle' | 'unknown';

export type SwitchMounting = 'wall' | 'panel' | 'desk' | 'remote' | 'unknown';

export interface Switch {
  /** Actuation style. */
  switchType?: SwitchType;

  /** Physical mounting style. */
  mounting?: SwitchMounting;

  /** Number of independently switched gangs. */
  gangCount?: number;

  /** Rated current in amps. */
  ratedCurrentA?: number;

  /** Whether the switch is illuminated (LED indicator). */
  illuminated?: boolean;

  /** Free-form per-instance override of catalog defaults. */
  overrides?: Record<string, unknown>;
}

export default Switch;