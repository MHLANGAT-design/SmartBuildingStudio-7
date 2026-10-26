// src/modules/FloorPlanDesigner/Inspector/RawGeometryInspector.tsx
//
// Inspector for elements with type 'rawgeometry'. Provides identity,
// geometry info, and the Reclassify control, which promotes the element
// to wall / door / window (or back to raw). Needed because raw elements
// are selectable on the canvas and appear in the ComponentExplorer's
// "Raw Geometry" section, but until this file existed there was no
// inspector to open when they were selected.

import React, { useMemo } from "react";
import { useAppSelector } from "@/Application/ConfigureStore";
import { ReclassifyControls } from "./ReclassifyControls";

interface RawGeometryInspectorProps {
  selection?: any;
}

export function RawGeometryInspector({ selection }: RawGeometryInspectorProps) {
  const floorPlanState = useAppSelector((state: any) => state.floorPlan || {});
  const document = floorPlanState.document || {};
  const elements: any[] = Array.isArray(document.elements) ? document.elements : [];

  const activeElement = useMemo(() => {
    const selectionId = selection?.id ?? selection?.Id;
    if (!selectionId) return null;
    return (
      elements.find((e) => String(e.id ?? e.Id) === String(selectionId)) ??
      selection
    );
  }, [selection, elements]);

  if (!activeElement) return null;

  const id = String(activeElement.id ?? activeElement.Id ?? "");
  const originalLayer = String(
    activeElement.originalLayer ?? activeElement.layer ?? ""
  );
  const points: { x: number; y: number }[] = Array.isArray(activeElement.points)
    ? activeElement.points
    : [];

  const pointCount = points.length;
  const geometryKind: "point" | "line" | "polyline" =
    pointCount === 0 ? "point" : pointCount === 2 ? "line" : "polyline";

  const length =
    pointCount >= 2
      ? Math.hypot(
          points[points.length - 1].x - points[0].x,
          points[points.length - 1].y - points[0].y
        )
      : 0;

  const angleDeg =
    pointCount >= 2
      ? (Math.atan2(
          points[points.length - 1].y - points[0].y,
          points[points.length - 1].x - points[0].x
        ) * 180) / Math.PI
      : 0;

  const bbox = useMemo(() => {
    if (pointCount === 0) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
  }, [points, pointCount]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#E2E8F0",
        minWidth: 0,
      }}
    >
      <ReclassifyControls elementId={id} current="raw" />

      <div
        style={{
          position: "relative",
          paddingBottom: "12px",
          borderBottom: "1px solid #1E293B",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "4px",
            background: "linear-gradient(180deg, #A78BFA, #7C3AED)",
            borderRadius: "4px",
          }}
        />
        <div
          style={{
            paddingLeft: "12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <span
              style={{
                color: "#64748B",
                fontSize: "9px",
                fontWeight: "bold",
                textTransform: "uppercase",
              }}
            >
              Unclassified Element
            </span>
            <div
              style={{
                fontSize: "13px",
                fontWeight: "bold",
                color: "#A78BFA",
                marginTop: "2px",
              }}
            >
              Raw Geometry
            </div>
          </div>
          <span
            style={{
              fontSize: "10px",
              color: "#A78BFA",
              backgroundColor: "#0F172A",
              padding: "2px 6px",
              borderRadius: "4px",
              border: "1px solid #7C3AED",
              flexShrink: 0,
            }}
          >
            {id || "—"}
          </span>
        </div>
      </div>

      <div
        style={{
          backgroundColor: "#0B0F19",
          padding: "16px",
          borderRadius: "12px",
          border: "1px solid #1E293B",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          minWidth: 0,
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
          Geometry
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            minWidth: 0,
          }}
        >
          <ReadonlyField label="Kind" value={geometryKind} accent="#A78BFA" />
          <ReadonlyField label="Points" value={String(pointCount)} />
          <ReadonlyField
            label="Length"
            value={pointCount >= 2 ? `${length.toFixed(1)} mm` : "—"}
            accent="#A78BFA"
          />
          <ReadonlyField
            label="Orientation"
            value={pointCount >= 2 ? `${angleDeg.toFixed(1)}°` : "—"}
          />
          <ReadonlyField label="Layer" value={originalLayer || "—"} />
          {bbox && (
            <>
              <ReadonlyField
                label="Bounding W"
                value={`${bbox.w.toFixed(0)} mm`}
              />
              <ReadonlyField
                label="Bounding H"
                value={`${bbox.h.toFixed(0)} mm`}
              />
              <ReadonlyField
                label="Min X, Y"
                value={`${bbox.minX.toFixed(0)}, ${bbox.minY.toFixed(0)}`}
              />
              <ReadonlyField
                label="Max X, Y"
                value={`${bbox.maxX.toFixed(0)}, ${bbox.maxY.toFixed(0)}`}
              />
            </>
          )}
        </div>

        <div
          style={{
            fontSize: "9px",
            color: "#475569",
            lineHeight: 1.5,
            marginTop: 4,
          }}
        >
          Raw geometry is DXF content the layer classifier couldn't route to
          a wall / door / window / room / fixture. Use the Reclassify panel
          above to move this element into the right category.
        </div>
      </div>
    </div>
  );
}

function ReadonlyField({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        minWidth: 0,
      }}
    >
      <span style={{ fontSize: "9px", color: "#64748B" }}>{label}</span>
      <span
        style={{
          fontSize: "11px",
          color: accent ?? "#F1F5F9",
          fontWeight: "bold",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          minWidth: 0,
        }}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}

export default RawGeometryInspector;