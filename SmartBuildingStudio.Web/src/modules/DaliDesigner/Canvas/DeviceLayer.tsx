// src/modules/DaliDesigner/Canvas/DeviceLayer.tsx
import React from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectDevices,
  selectSelection,
} from "@/modules/DaliDesigner/store/daliSelectors";
import {
  assignDevicesToGroup,
  removeDevicesFromGroup,
} from "@/modules/DaliDesigner/store/daliSlice";
import { assignDeviceToLine } from "@/modules/DaliDesigner/store/daliThunks";
import { useLayerVisible } from "@/modules/DaliDesigner/hooks/useLayerVisible";
import type { ViewTransform } from "@/modules/Shared/Canvas/Transform";

interface Props {
  transform: ViewTransform;
}

const KIND_VISUALS: Record<string, { color: string; glyph: string }> = {
  luminaire:      { color: "#FACC15", glyph: "L" },
  emergencylight: { color: "#EF4444", glyph: "E" },
  emergency:      { color: "#EF4444", glyph: "E" },
  sensor:         { color: "#FB923C", glyph: "S" },
  controller:     { color: "#34D399", glyph: "C" },
  gateway:        { color: "#A855F7", glyph: "G" },
  switch:         { color: "#22D3EE", glyph: "W" },
  driver:         { color: "#818CF8", glyph: "D" },
  powersupply:    { color: "#FB7185", glyph: "P" },
};

const DEFAULT_VISUAL = { color: "#94A3B8", glyph: "?" };

function visualForDevice(d: {
  kind: string;
  metadata?: { sourceKind?: string };
}): { color: string; glyph: string } {
  const sourceKind = String(d.metadata?.sourceKind ?? "")
    .toLowerCase()
    .replace(/[_\s-]/g, "");

  if (sourceKind && KIND_VISUALS[sourceKind]) return KIND_VISUALS[sourceKind];

  switch (String(d.kind).toLowerCase()) {
    case "sensor":  return KIND_VISUALS.sensor;
    case "switch":  return KIND_VISUALS.switch;
    case "ballast":
    default:        return KIND_VISUALS.luminaire;
  }
}

export function DeviceLayer({ transform }: Props) {
  const visible = useLayerVisible("devices");
  const dispatch = useAppDispatch();
  const devices = useAppSelector(selectDevices);
  const selection = useAppSelector(selectSelection);

  if (!visible) return null;

  const positionedDevices = devices.filter((d) => !!d.metadata.position);

  const assignmentMode = !!selection.assignmentMode;
  const subMode = selection.assignmentSubMode ?? "add";
  const groupId = selection.groupId;
  const lineId = selection.lineId;

  // Two mutually-exclusive assignment targets. Exactly one of these is
  // non-null when assignment mode is active (the user cannot be editing
  // a group and a line simultaneously — DaliInspector / DaliLineExplorer
  // / GroupExplorer enforce that by clearing the other field when the
  // user changes selection kind).
  const groupTarget = assignmentMode && groupId ? groupId : null;
  const lineTarget = assignmentMode && lineId ? lineId : null;

  const worldToScreen = (p: { x: number; y: number }) => ({
    x:
      transform.width / 2 +
      transform.offsetX +
      (p.x - transform.centerX) * transform.finalScale,
    y:
      transform.height / 2 +
      transform.offsetY +
      (p.y - transform.centerY) * transform.yScale,
  });

  const handleAssignClick = (
    deviceId: string,
    isInGroup: boolean,
    isOnLine: boolean
  ) => {
    // Group assignment path — unchanged from the previous behavior.
    if (groupTarget) {
      if (subMode === "add" && isInGroup) return;
      if (subMode === "remove" && !isInGroup) return;

      if (subMode === "add") {
        dispatch(
          assignDevicesToGroup({ groupId: groupTarget, deviceIds: [deviceId] })
        );
      } else {
        dispatch(
          removeDevicesFromGroup({ groupId: groupTarget, deviceIds: [deviceId] })
        );
      }
      return;
    }

    // Line assignment path.
    if (lineTarget) {
      if (subMode === "add" && isOnLine) return;
      if (subMode === "remove" && !isOnLine) return;

      dispatch(
        assignDeviceToLine({
          deviceIds: [deviceId],
          lineId: subMode === "add" ? lineTarget : null,
        })
      );
      return;
    }
  };

  return (
    <g className="dali-layer dali-layer-device">
      {positionedDevices.map((d) => {
        const pos = d.metadata.position!;
        const p = worldToScreen(pos);
        const selected = selection.deviceIds.includes(d.id);
        const visual = visualForDevice(d);

        const inGroup = groupId ? d.groupIds.includes(groupId) : false;
        const onLine = lineId ? d.lineId === lineId : false;

        // Dimmed when a group or line is selected (view mode) and this
        // device isn't part of it. In assignment mode, no dimming —
        // every device is a potential click target.
        const dimmed =
          (!!groupTarget && !assignmentMode && !inGroup) ||
          (!!lineTarget && !assignmentMode && !onLine);

        // Actionable in assignment mode:
        //   group target: subMode='add' requires !inGroup;
        //                 subMode='remove' requires inGroup.
        //   line target:  subMode='add' requires !onLine;
        //                 subMode='remove' requires onLine.
        const assignmentTarget =
          assignmentMode && (
            (groupTarget &&
              ((subMode === "add" && !inGroup) ||
                (subMode === "remove" && inGroup))) ||
            (lineTarget &&
              ((subMode === "add" && !onLine) ||
                (subMode === "remove" && onLine)))
          );

        const radius = selected ? 9 : 6;

        return (
          <g
            key={d.id}
            transform={`translate(${p.x},${p.y})`}
            opacity={dimmed ? 0.28 : 1}
            style={
              assignmentTarget
                ? { pointerEvents: "auto", cursor: "pointer" }
                : undefined
            }
            onClick={
              assignmentTarget
                ? (e) => {
                    e.stopPropagation();
                    handleAssignClick(d.id, inGroup, onLine);
                  }
                : undefined
            }
          >
            {selected && (
              <circle
                r={radius + 5}
                fill="rgba(56, 189, 248, 0.25)"
                stroke="#38BDF8"
                strokeWidth={1.5}
              />
            )}

            {assignmentTarget && (
              <circle
                r={radius + 4}
                fill="none"
                stroke={subMode === "add" ? "#4ADE80" : "#F87171"}
                strokeWidth={1.5}
                strokeDasharray="3,2"
              />
            )}

            <circle
              r={radius}
              fill={visual.color}
              stroke="rgba(255,255,255,0.55)"
              strokeWidth={1}
            />

            <text
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#0A0A0A"
              fontSize={8}
              fontWeight="bold"
              fontFamily="monospace"
              style={{ pointerEvents: "none" }}
            >
              {visual.glyph}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export default DeviceLayer;