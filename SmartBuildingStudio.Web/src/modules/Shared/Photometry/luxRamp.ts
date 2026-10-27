// src/modules/Shared/Photometry/luxRamp.ts

/**
 * Lux → RGBA ramp used by both FixturePlacementStudio and
 * EmergencyLighting heatmaps. Domain-standards thresholds:
 *   30 lx  = dark (egress minimum is often 1 lx at floor)
 *   100 lx = maintenance / ambient minimum
 *   300 lx = office / classroom target
 *   500 lx = detail-oriented work
 *   750 lx = over-lit
 *
 * The first two stops fade to near-transparent so dark regions don't
 * obscure the floor plan geometry beneath.
 */
export const LUX_RAMP: Array<[number, [number, number, number], number]> = [
  [0,    [0, 0, 0],       0.00],
  [5,    [120, 20, 20],   0.15],
  [30,   [180, 40, 30],   0.35],
  [100,  [230, 90, 40],   0.45],
  [200,  [230, 180, 40],  0.45],
  [300,  [120, 200, 80],  0.45],
  [500,  [60, 180, 210],  0.45],
  [750,  [60, 100, 220],  0.45],
  [1200, [60, 60, 180],   0.45],
];

/** Legend stops (opaque colors for the on-screen gradient bar). */
export const LUX_LEGEND_STOPS: Array<[number, string]> = [
  [0,   'rgba(180, 40, 30, 1)'],
  [100, 'rgba(230, 90, 40, 1)'],
  [200, 'rgba(230, 180, 40, 1)'],
  [300, 'rgba(120, 200, 80, 1)'],
  [500, 'rgba(60, 180, 210, 1)'],
  [750, 'rgba(60, 100, 220, 1)'],
];

/** Max lux on the legend bar — values above are clamped visually. */
export const LUX_LEGEND_MAX = 750;

/**
 * Convert lux to an `rgba(...)` string from the ramp, or null when the
 * lux is below the visible threshold (0.01 alpha).
 */
export function luxToColor(lux: number): string | null {
  if (!isFinite(lux) || lux <= 0) return null;

  let lower = LUX_RAMP[0];
  let upper = LUX_RAMP[LUX_RAMP.length - 1];

  for (let i = 0; i < LUX_RAMP.length - 1; i++) {
    if (lux >= LUX_RAMP[i][0] && lux <= LUX_RAMP[i + 1][0]) {
      lower = LUX_RAMP[i];
      upper = LUX_RAMP[i + 1];
      break;
    }
    if (lux > LUX_RAMP[LUX_RAMP.length - 1][0]) {
      lower = LUX_RAMP[LUX_RAMP.length - 1];
      upper = LUX_RAMP[LUX_RAMP.length - 1];
    }
  }

  const [luxLo, rgbLo, alphaLo] = lower;
  const [luxHi, rgbHi, alphaHi] = upper;
  const span = luxHi - luxLo;
  const t = span <= 0 ? 0 : (lux - luxLo) / span;

  const r = Math.round(rgbLo[0] + (rgbHi[0] - rgbLo[0]) * t);
  const g = Math.round(rgbLo[1] + (rgbHi[1] - rgbLo[1]) * t);
  const b = Math.round(rgbLo[2] + (rgbHi[2] - rgbLo[2]) * t);
  const a = alphaLo + (alphaHi - alphaLo) * t;

  if (a <= 0.01) return null;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}