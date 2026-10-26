// src/modules/DaliDesigner/Canvas/RoomLayer.tsx
//
// SVG overlay for room annotations.
//
// Room geometry (polygon fill + stroke) is drawn on the plan canvas by
// CanvasRenderer. This layer adds the text annotations on top:
//
//   • Room name (uppercase, green, prominent)
//   • Target lux and primary group ("750 lx | G1")
//   • Area in m²
//
// Reads rooms from the same render model the canvas uses, so labels
// stay in sync with geometry. Each label is positioned at the room
// polygon's centroid.
//
// Rooms are elements (type === "room", isRoom === true) — same
// representation FixturePlacementStudio uses. No separate deserialization.

import React from "react";
import { useAppSelector } from "@/store/hooks";
import { selectFloorplanModel } from "@/modules/DaliDesigner/store/daliSelectors";
import { useLayerVisible } from "@/modules/DaliDesigner/hooks/useLayerVisible";
import type { ViewTransform } from "@/modules/Shared/Canvas/Transform";

interface Props {
  transform: ViewTransform;
}

export function RoomLayer({ transform }: Props) {
  const visible = useLayerVisible("rooms");
  const model = useAppSelector(selectFloorplanModel);

  if (!visible || !model) return null;

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

  const rooms = model.elements.filter((el) => {
    const t = String(el.type ?? "").toLowerCase();
    return t === "room" || t === "rooms" || el.isRoom === true;
  });

  return (
    <g className="dali-layer dali-layer-room">
      {rooms.map((room) => {
        const pts = room.points ?? [];
        if (pts.length < 3) return null;

        // Centroid of the polygon's vertices (simple average).
        // Good enough for label placement — matches FPS's approach.
        let cx = 0;
        let cy = 0;
        for (const p of pts) {
          cx += p.x;
          cy += p.y;
        }
        cx /= pts.length;
        cy /= pts.length;

        const p = toScreen({ x: cx, y: cy });

        const name = String(room.name ?? "Unnamed Room");
        const targetLux = Number(room.targetLux ?? 500);
        const primaryGroup = Number(room.primaryGroup ?? 1);
        const areaM2 = polygonAreaM2(pts);

        return (
          <g key={room.id} transform={`translate(${p.x},${p.y})`}>
            {/* Name */}
            <text
              y={-12}
              textAnchor="middle"
              fill="rgba(74, 222, 128, 0.95)"
              fontSize={11}
              fontWeight="bold"
              fontFamily="monospace"
              style={{
                paintOrder: "stroke",
                stroke: "rgba(0, 0, 0, 0.85)",
                strokeWidth: 3,
                pointerEvents: "none",
              }}
            >
              {name.toUpperCase()}
            </text>

            {/* Target lux + group */}
            <text
              y={2}
              textAnchor="middle"
              fill="rgba(255, 255, 255, 0.65)"
              fontSize={9}
              fontFamily="monospace"
              style={{
                paintOrder: "stroke",
                stroke: "rgba(0, 0, 0, 0.85)",
                strokeWidth: 3,
                pointerEvents: "none",
              }}
            >
              {targetLux} lx  |  G{primaryGroup}
            </text>

            {/* Area in m² */}
            <text
              y={14}
              textAnchor="middle"
              fill="rgba(255, 255, 255, 0.45)"
              fontSize={9}
              fontFamily="monospace"
              style={{
                paintOrder: "stroke",
                stroke: "rgba(0, 0, 0, 0.85)",
                strokeWidth: 3,
                pointerEvents: "none",
              }}
            >
              {areaM2.toFixed(2)} m²
            </text>
          </g>
        );
      })}
    </g>
  );
}

/**
 * Polygon area in square metres.
 *
 * Assumes world coordinates are millimetres (the convention used by
 * FloorPlanDesigner's imported DWG geometry). Divides the raw mm² area
 * by 1_000_000 to convert to m².
 */
function polygonAreaM2(points: { x: number; y: number }[]): number {
  if (points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2 / 1_000_000;
}

export default RoomLayer;