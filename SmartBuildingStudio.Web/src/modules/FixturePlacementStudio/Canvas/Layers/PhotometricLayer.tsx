// src/modules/FixturePlacementStudio/Canvas/Layers/PhotometricLayer.ts
//
// Photometric heatmap overlay renderer.
//
// Renders an illuminance-map calculation as translucent coloured cells
// over the canvas. Called during the FixtureCanvas render loop when the
// heatmap toggle is on and a calculation is available.
//
// The authoritative source is `calculation.result.samples` — one record
// per sampled point with world coordinates and a lux value. Falls back
// to the flat `values` grid only for older calculations that lack
// samples. Falls back to PhotometricData.samples as a third option.

import type {
  LightingCalculation,
  IlluminanceMapResult,
  IlluminanceSampleRecord,
} from '@/modules/FixturePlacementStudio/models/LightingCalculation';
import type { PhotometricData } from '@/modules/FixturePlacementStudio/models/PhotometricData';
import type { ViewportLike, ViewTransform } from '@/modules/Shared/Canvas/Transform';

// ─── Colour ramp ─────────────────────────────────────────────────────────────

/**
 * Lux → RGB stops. Interior design scale: values below 30 lx are
 * effectively "dark", 300–500 is the standard office target, above
 * 750 is over-lit.
 *
 * The first two stops fade to transparent so areas with no meaningful
 * light don't get a red wash that hides the floor plan.
 */
const RAMP: Array<[number, [number, number, number], number]> = [
  [0,   [0, 0, 0],      0.00],
  [5,   [120, 20, 20],  0.15],
  [30,  [180, 40, 30],  0.35],
  [100, [230, 90, 40],  0.45],
  [200, [230, 180, 40], 0.45],
  [300, [120, 200, 80], 0.45],
  [500, [60, 180, 210], 0.45],
  [750, [60, 100, 220], 0.45],
  [1200,[60, 60, 180],  0.45],
];

const BLUR_RADIUS_PX = 8;

function luxToColor(lux: number): string | null {
  if (!isFinite(lux) || lux <= 0) return null;

  let lower = RAMP[0];
  let upper = RAMP[RAMP.length - 1];

  for (let i = 0; i < RAMP.length - 1; i++) {
    if (lux >= RAMP[i][0] && lux <= RAMP[i + 1][0]) {
      lower = RAMP[i];
      upper = RAMP[i + 1];
      break;
    }
    if (lux > RAMP[RAMP.length - 1][0]) {
      lower = RAMP[RAMP.length - 1];
      upper = RAMP[RAMP.length - 1];
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

// ─── Layer renderer ──────────────────────────────────────────────────────────

export function drawPhotometricHeatmap(
  ctx: CanvasRenderingContext2D,
  viewport: ViewportLike,
  tf: ViewTransform,
  calculation: LightingCalculation | null,
  photometricData: PhotometricData | null
): void {
  if (!calculation || !calculation.result) return;
  if (calculation.kind !== 'illuminance-map') return;

  const result = calculation.result as IlluminanceMapResult;
  if (!result.bounds) return;

  // ── Priority 1: samples on the calculation result. ──────────────
  // This is the authoritative path — samples carry real world
  // coordinates so no grid reconstruction is needed.
  if (result.samples && result.samples.length > 0) {
    drawFromSamples(
      ctx,
      viewport,
      result.samples,
      result.resolutionMeters
    );
    drawLegend(ctx);
    return;
  }

  // ── Priority 2: samples on the photometric data. ────────────────
  if (
    photometricData &&
    photometricData.samples &&
    photometricData.samples.length > 0
  ) {
    drawFromSamples(
      ctx,
      viewport,
      photometricData.samples.map((s) => ({
        x: s.x,
        y: s.y,
        z: s.z,
        lux: s.lux,
      })),
      photometricData.resolutionMeters
    );
    drawLegend(ctx);
    return;
  }

  // ── Priority 3: flat grid fallback (legacy). ────────────────────
  if (result.values && result.values.length > 0) {
    drawFromGrid(ctx, viewport, tf, result);
    drawLegend(ctx);
  }
}

// ─── Rendering internals ─────────────────────────────────────────────────────

function drawFromSamples(
  ctx: CanvasRenderingContext2D,
  viewport: ViewportLike,
  samples: IlluminanceSampleRecord[],
  resolutionMeters: number
): void {
  if (samples.length === 0 || resolutionMeters <= 0) return;

  // Filter out meaningless samples so we don't paint invisible
  // transparent cells across the whole canvas.
  const meaningful = samples.filter((s) => s.lux > 0.5);
  if (meaningful.length === 0) return;

  const sample0 = meaningful[0];
  const centerScreen = viewport.worldToScreen({ x: sample0.x, y: sample0.y });
  const edgeScreen = viewport.worldToScreen({
    x: sample0.x + resolutionMeters * 1000, // meters → mm (world units)
    y: sample0.y,
  });
  const cellSizePx = Math.abs(edgeScreen.x - centerScreen.x);

  if (cellSizePx < 2) return;

  const drawCellSize = Math.min(cellSizePx * 1.4, 60);

  ctx.save();
  ctx.filter = `blur(${BLUR_RADIUS_PX}px)`;
  for (const s of meaningful) {
    const color = luxToColor(s.lux);
    if (!color) continue;
    const p = viewport.worldToScreen({ x: s.x, y: s.y });
    ctx.fillStyle = color;
    ctx.fillRect(
      p.x - drawCellSize / 2,
      p.y - drawCellSize / 2,
      drawCellSize,
      drawCellSize
    );
  }
  ctx.filter = 'none';
  ctx.restore();
}

function drawFromGrid(
  ctx: CanvasRenderingContext2D,
  viewport: ViewportLike,
  _tf: ViewTransform,
  result: IlluminanceMapResult
): void {
  const { bounds, resolutionMeters, values } = result;
  if (!bounds || !values || values.length === 0 || resolutionMeters <= 0) return;

  const centerScreen = viewport.worldToScreen({ x: bounds.minX, y: bounds.minY });
  const edgeScreen = viewport.worldToScreen({
    x: bounds.minX + resolutionMeters * 1000,
    y: bounds.minY,
  });
  const cellSizePx = Math.abs(edgeScreen.x - centerScreen.x);
  if (cellSizePx < 2) return;
  const drawCellSize = Math.min(cellSizePx * 1.4, 60);

  const totalCells = values.length;
  const spanX = bounds.maxX - bounds.minX;
  const spanY = bounds.maxY - bounds.minY;
  const aspect = spanX > 0 && spanY > 0 ? spanX / spanY : 1;
  const cols = Math.max(1, Math.round(Math.sqrt(totalCells * aspect)));
  const rows = Math.max(1, Math.ceil(totalCells / cols));
  const stepMm = resolutionMeters * 1000;

  ctx.save();
  ctx.filter = `blur(${BLUR_RADIUS_PX}px)`;

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const idx = j * cols + i;
      if (idx >= totalCells) break;
      const lux = values[idx];
      const color = luxToColor(lux);
      if (!color) continue;
      const wx = bounds.minX + i * stepMm;
      const wy = bounds.minY + j * stepMm;
      const p = viewport.worldToScreen({ x: wx, y: wy });
      ctx.fillStyle = color;
      ctx.fillRect(
        p.x - drawCellSize / 2,
        p.y - drawCellSize / 2,
        drawCellSize,
        drawCellSize
      );
    }
  }

  ctx.filter = 'none';
  ctx.restore();
}

// ─── Legend ──────────────────────────────────────────────────────────────────

const LEGEND_STOPS: Array<[number, string]> = [
  [0,   'rgba(180, 40, 30, 1)'],
  [100, 'rgba(230, 90, 40, 1)'],
  [200, 'rgba(230, 180, 40, 1)'],
  [300, 'rgba(120, 200, 80, 1)'],
  [500, 'rgba(60, 180, 210, 1)'],
  [750, 'rgba(60, 100, 220, 1)'],
];

function drawLegend(ctx: CanvasRenderingContext2D): void {
  const x = 16;
  const y = 16;
  const barWidth = 220;
  const barHeight = 12;

  ctx.save();

  // Background panel.
  ctx.fillStyle = 'rgba(11, 15, 25, 0.85)';
  ctx.strokeStyle = 'rgba(30, 41, 59, 1)';
  ctx.lineWidth = 1;
  const panelWidth = barWidth + 28;
  const panelHeight = 46;
  roundRect(ctx, x - 14, y - 14, panelWidth, panelHeight, 4);
  ctx.fill();
  ctx.stroke();

  // Title.
  ctx.fillStyle = '#94A3B8';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('ILLUMINANCE (LUX)', x, y);

  // Gradient bar.
  const barY = y + 14;
  const gradient = ctx.createLinearGradient(x, barY, x + barWidth, barY);
  const maxLux = 750;
  for (const [lux, color] of LEGEND_STOPS) {
    const stop = Math.min(1, lux / maxLux);
    gradient.addColorStop(stop, color);
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(x, barY, barWidth, barHeight);
  ctx.strokeStyle = 'rgba(30, 41, 59, 1)';
  ctx.strokeRect(x, barY, barWidth, barHeight);

  // Labels.
  ctx.fillStyle = '#64748B';
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const labels: Array<[number, string]> = [
    [0, '0'],
    [100, '100'],
    [300, '300'],
    [500, '500'],
    [750, '750+'],
  ];
  for (const [lux, label] of labels) {
    const lx = x + (Math.min(1, lux / maxLux) * barWidth);
    ctx.fillText(label, lx, barY + barHeight + 4);
  }

  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export default drawPhotometricHeatmap;