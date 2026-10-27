// src/modules/EmergencyLighting/Canvas/HeatmapLegend.tsx
//
// Fixed-position legend for the illuminance heatmap. Rendered as SVG
// inside EmergencyCanvas's overlay, anchored to the top-left of the
// visible canvas so it stays visible regardless of pan/zoom.
//
// Pulls its stops from '@/modules/Shared/Photometry/luxRamp' so the
// legend always matches the heatmap colors. If luxRamp.ts changes,
// the legend follows automatically.

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import {
  LUX_LEGEND_STOPS,
  LUX_LEGEND_MAX,
} from '@/modules/Shared/Photometry/luxRamp';

interface HeatmapLegendProps {
  /** Horizontal offset from the canvas left edge, in CSS pixels. */
  offsetX?: number;
  /** Vertical offset from the canvas top edge, in CSS pixels. */
  offsetY?: number;
}

const TICK_VALUES: number[] = [0, 100, 300, 500, LUX_LEGEND_MAX];

export const HeatmapLegend: React.FC<HeatmapLegendProps> = ({
  offsetX = 16,
  offsetY = 16,
}) => {
  const visible = useAppSelector((s: any) => s.emergency.layerVisibility.heatmap);
  const hasData = useAppSelector((s: any) => !!s.emergency.heatmap.data);

  if (!visible || !hasData) return null;

  const barWidth = 220;
  const barHeight = 12;
  const panelPad = 14;
  const titleHeight = 12;
  const labelHeight = 12;
  const panelWidth = barWidth + panelPad * 2;
  const panelHeight = titleHeight + 6 + barHeight + 6 + labelHeight + panelPad * 2;

  const panelX = offsetX;
  const panelY = offsetY;
  const titleY = panelY + panelPad;
  const barX = panelX + panelPad;
  const barY = titleY + titleHeight + 6;
  const labelY = barY + barHeight + 6;

  return (
    <g style={{ pointerEvents: 'none' }}>
      <defs>
        <linearGradient
          id="em-heatmap-legend-gradient"
          x1={barX}
          y1={barY}
          x2={barX + barWidth}
          y2={barY}
          gradientUnits="userSpaceOnUse"
        >
          {LUX_LEGEND_STOPS.map(([lux, color], i) => {
            const stop = Math.min(1, lux / LUX_LEGEND_MAX);
            // Give each stop a mid-position anchor for a smooth ramp
            // when adjacent stops are far apart (e.g. 0 → 100).
            return (
              <stop
                key={i}
                offset={stop}
                stopColor={colorToStops(color)}
              />
            );
          })}
        </linearGradient>
      </defs>

      {/* Panel */}
      <rect
        x={panelX}
        y={panelY}
        width={panelWidth}
        height={panelHeight}
        rx={4}
        fill="rgba(11, 15, 25, 0.85)"
        stroke="rgba(30, 41, 59, 1)"
        strokeWidth={1}
      />

      {/* Title */}
      <text
        x={panelX + panelPad}
        y={titleY}
        fill="#94A3B8"
        fontSize={9}
        fontFamily="monospace"
        fontWeight="bold"
        dominantBaseline="hanging"
      >
        ILLUMINANCE (LUX)
      </text>

      {/* Gradient bar */}
      <rect
        x={barX}
        y={barY}
        width={barWidth}
        height={barHeight}
        fill="url(#em-heatmap-legend-gradient)"
        stroke="rgba(30, 41, 59, 1)"
        strokeWidth={1}
      />

      {/* Tick labels */}
      {TICK_VALUES.map((lux) => {
        const t = Math.min(1, lux / LUX_LEGEND_MAX);
        const x = barX + t * barWidth;
        const label = lux >= LUX_LEGEND_MAX ? `${LUX_LEGEND_MAX}+` : String(lux);
        return (
          <text
            key={lux}
            x={x}
            y={labelY}
            fill="#64748B"
            fontSize={8}
            fontFamily="monospace"
            textAnchor={t <= 0.05 ? 'start' : t >= 0.95 ? 'end' : 'middle'}
            dominantBaseline="hanging"
          >
            {label}
          </text>
        );
      })}
    </g>
  );
};

/**
 * Extract the "r, g, b" from an "rgba(r, g, b, a)" string so the SVG
 * gradient stop only uses the color — the alpha is handled by the bar
 * itself. LUX_LEGEND_STOPS colors are always fully opaque.
 */
function colorToStops(rgba: string): string {
  const m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(rgba);
  if (!m) return rgba;
  return `rgb(${m[1]}, ${m[2]}, ${m[3]})`;
}

export default HeatmapLegend;