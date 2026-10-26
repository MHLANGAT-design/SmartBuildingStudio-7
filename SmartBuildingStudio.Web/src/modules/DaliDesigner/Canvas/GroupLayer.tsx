// src/modules/DaliDesigner/Canvas/GroupLayer.tsx
import React from "react";
import { useAppSelector } from "@/store/hooks";
import {
  selectGroups,
  selectDevices,
  selectSelection,
} from "@/modules/DaliDesigner/store/daliSelectors";
import { useLayerVisible } from "@/modules/DaliDesigner/hooks/useLayerVisible";
import type { ViewTransform } from "@/modules/Shared/Canvas/Transform";

interface Props {
  transform: ViewTransform;
}

const GROUP_COLORS = ["#ff7a45", "#36cfc9", "#b37feb", "#ffc53d", "#ff85c0"];

export function GroupLayer({ transform }: Props) {
  const visible = useLayerVisible("groups");
  const groups = useAppSelector(selectGroups);
  const devices = useAppSelector(selectDevices);
  const selection = useAppSelector(selectSelection);

  if (!visible) return null;

  const toScreen = (p: { x: number; y: number }) => ({
    x:
      transform.width / 2 +
      transform.offsetX +
      (p.x - transform.centerX) * transform.finalScale,
    y:
      transform.height / 2 +
      transform.offsetY +
      (p.y - transform.centerY) * transform.yScale,
  });

  return (
    <g className="dali-layer dali-layer-group">
      {groups.map((g, i) => {
        const members = devices.filter((d) => d.groupIds.includes(g.id));
        if (members.length === 0) return null;

        const isSelected = selection.groupId === g.id;

        const cx =
          members.reduce((a, m) => a + (m.metadata.position?.x ?? 0), 0) /
          members.length;
        const cy =
          members.reduce((a, m) => a + (m.metadata.position?.y ?? 0), 0) /
          members.length;
        const c = toScreen({ x: cx, y: cy });
        const color = GROUP_COLORS[i % GROUP_COLORS.length];

        const spokeWidth = isSelected ? 2.5 : 1;
        const spokeOpacity = isSelected ? 0.85 : 0.35;
        const centroidRadius = isSelected ? 14 : 10;
        const centroidFillOpacity = isSelected ? 0.4 : 0.15;
        const centroidStrokeWidth = isSelected ? 2 : 1;
        const labelSize = isSelected ? 11 : 9;
        const labelWeight = isSelected ? "bold" : "normal";

        return (
          <g key={g.id}>
            {/* Radial spokes from centroid to each member */}
            {members.map((m) => {
              const p = toScreen(m.metadata.position ?? { x: 0, y: 0 });
              return (
                <line
                  key={m.id}
                  x1={c.x}
                  y1={c.y}
                  x2={p.x}
                  y2={p.y}
                  stroke={color}
                  strokeOpacity={spokeOpacity}
                  strokeWidth={spokeWidth}
                />
              );
            })}

            {/* Selection halo — only when the group is selected */}
            {isSelected && (
              <circle
                cx={c.x}
                cy={c.y}
                r={centroidRadius + 8}
                fill="none"
                stroke={color}
                strokeWidth={1.5}
                strokeDasharray="4,3"
                opacity={0.9}
              />
            )}

            {/* Centroid node */}
            <circle
              cx={c.x}
              cy={c.y}
              r={centroidRadius}
              fill={color}
              fillOpacity={centroidFillOpacity}
              stroke={color}
              strokeWidth={centroidStrokeWidth}
            />

            {/* Label */}
            <text
              x={c.x}
              y={c.y + 3}
              textAnchor="middle"
              fill={color}
              fontSize={labelSize}
              fontWeight={labelWeight}
              style={{ pointerEvents: "none" }}
            >
              {g.name}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export default GroupLayer;