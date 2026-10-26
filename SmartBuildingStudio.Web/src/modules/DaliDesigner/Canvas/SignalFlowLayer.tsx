// src/modules/DaliDesigner/Canvas/SignalFlowLayer.tsx
import React, { useMemo } from "react";
import { useLayerVisible } from "@/modules/DaliDesigner/hooks/useLayerVisible";
import { useAppSelector } from "@/store/hooks";
import {
  selectDocument,
  selectSelection,
} from "@/modules/DaliDesigner/store/daliSelectors";
import type { ViewTransform } from "@/modules/Shared/Canvas/Transform";

interface Props {
  transform: ViewTransform;
}

interface FlowSegment {
  key: string;
  deviceId: string;
  label: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  level: number;
}

export function SignalFlowLayer({ transform }: Props) {
  const visible = useLayerVisible("signalFlow");
  const doc = useAppSelector(selectDocument);
  const selection = useAppSelector(selectSelection);
  const activeSceneId = selection.activeSceneId;

  const segments = useMemo<FlowSegment[]>(() => {
    if (!activeSceneId) return [];
    if (!transform) return [];            // ← new guard
    const scene = doc.scenes.find((s) => s.id === activeSceneId);
    if (!scene) return [];

    const byId = new Map(doc.devices.map((d) => [d.id, d]));

    // Origin: canvas center (0,0). A v2 could use the scene's bounding
    // box center or a designated controller device.
    const [sx, sy] = applyTransform(0, 0, transform);

    const out: FlowSegment[] = [];
    for (const [deviceId, level] of Object.entries(scene.levels)) {
      if (level <= 0) continue;
      const d = byId.get(deviceId);
      if (!d) continue;
      const pos = d.metadata.position;
      if (!pos) continue;
      const [dx, dy] = applyTransform(pos.x, pos.y, transform);
      out.push({
        key: `flow-${deviceId}`,
        deviceId,
        label: d.label,
        x1: sx,
        y1: sy,
        x2: dx,
        y2: dy,
        level,
      });
    }
    return out;
  }, [doc, activeSceneId, transform]);

  if (!visible) return null;

  return (
    <div
      className="dali-signal-flow-layer"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <svg
        width="100%"
        height="100%"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        {segments.map((s) => {
          const t = Math.min(1, Math.max(0, s.level / 254));
          const opacity = 0.15 + 0.85 * t;
          const strokeWidth = 1 + 2 * t;
          return (
            <g key={s.key}>
              <line
                x1={s.x1}
                y1={s.y1}
                x2={s.x2}
                y2={s.y2}
                stroke="#4ea1ff"
                strokeWidth={strokeWidth}
                opacity={opacity}
                strokeLinecap="round"
              />
              <line
                x1={s.x1}
                y1={s.y1}
                x2={s.x2}
                y2={s.y2}
                stroke="#9ed0ff"
                strokeWidth={strokeWidth + 1}
                strokeLinecap="round"
                strokeDasharray="8 200"
                opacity={opacity}
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="208"
                  to="0"
                  dur="1.6s"
                  repeatCount="indefinite"
                />
              </line>
            </g>
          );
        })}
      </svg>

      {activeSceneId && (
        <div
          className="dali-signal-flow-indicator"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            padding: "6px 10px",
            background: "rgba(78,161,255,0.15)",
            color: "#7ecbff",
            border: "1px solid #4ea1ff",
            borderRadius: 4,
            fontSize: 11,
          }}
        >
          ● Signal flow active · {segments.length} device
          {segments.length === 1 ? "" : "s"}
        </div>
      )}
    </div>
  );
}

function applyTransform(
  x: number,
  y: number,
  t: ViewTransform | null | undefined
): [number, number] {
  if (!t) return [0, 0];                // ← fail safe
  return [x * t.zoom + t.offsetX, y * t.zoom + t.offsetY];
}

export default SignalFlowLayer;