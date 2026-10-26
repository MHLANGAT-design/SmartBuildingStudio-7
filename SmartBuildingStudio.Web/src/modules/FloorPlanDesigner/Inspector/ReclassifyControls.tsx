// src/modules/FloorPlanDesigner/Inspector/ReclassifyControls.tsx
//
// Shared reclassify control. Renders four buttons (Wall / Door /
// Window / Raw) and highlights the element's current class. Clicking
// a non-current button dispatches reclassifyElement to move the
// element to that class.

import React from "react";
import { useAppDispatch } from "@/Application/ConfigureStore";
import { reclassifyElement } from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";
import type { ReclassifyTarget } from "@/modules/FloorPlanDesigner/Store/reclassifyHelpers";

interface Props {
  elementId: string;
  current: ReclassifyTarget;
}

const LABELS: Record<ReclassifyTarget, string> = {
  wall: "Wall",
  door: "Door",
  window: "Window",
  raw: "Raw",
};

const COLORS: Record<ReclassifyTarget, string> = {
  wall: "#00D2FF",
  door: "#EAB308",
  window: "#38BDF8",
  raw: "#A78BFA",
};

export function ReclassifyControls({ elementId, current }: Props) {
  const dispatch = useAppDispatch();

  return (
    <div
      style={{
        backgroundColor: "#0B0F19",
        padding: "12px 16px",
        borderRadius: "12px",
        border: "1px solid #1E293B",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <div
        style={{
          fontSize: "9px",
          fontWeight: "bold",
          color: "#64748B",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        Reclassify
      </div>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {(Object.keys(LABELS) as ReclassifyTarget[]).map((target) => {
          const isCurrent = target === current;
          const color = COLORS[target];
          return (
            <button
              key={target}
              type="button"
              disabled={isCurrent}
              onClick={() => {
                if (isCurrent) return;
                if (
                  !window.confirm(
                    `Reclassify this element as "${LABELS[target]}"? ` +
                    `It will move from the current section to the ${LABELS[target]} section.`
                  )
                ) {
                  return;
                }
                dispatch(reclassifyElement({ id: elementId, target }));
                window.dispatchEvent(new CustomEvent("sbs:canvas-update"));
                window.dispatchEvent(new CustomEvent("canvas-invalidate"));
              }}
              style={{
                flex: "1 1 auto",
                minWidth: "72px",
                padding: "6px 10px",
                borderRadius: "6px",
                fontSize: "11px",
                fontFamily: "monospace",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                cursor: isCurrent ? "default" : "pointer",
                background: isCurrent ? `${color}20` : "transparent",
                border: `1px solid ${isCurrent ? color : "#334155"}`,
                color: isCurrent ? color : "#94A3B8",
                opacity: isCurrent ? 1 : 0.9,
              }}
              title={isCurrent ? `Already classified as ${LABELS[target]}` : `Reclassify as ${LABELS[target]}`}
            >
              {LABELS[target]}
              {isCurrent ? " ✓" : ""}
            </button>
          );
        })}
      </div>
      <div style={{ fontSize: "9px", color: "#475569", lineHeight: 1.4 }}>
        Use this when the DXF's layer names don't match the actual element.
        The semantic record moves between sections and the composite's
        color updates immediately.
      </div>
    </div>
  );
}

export default ReclassifyControls;