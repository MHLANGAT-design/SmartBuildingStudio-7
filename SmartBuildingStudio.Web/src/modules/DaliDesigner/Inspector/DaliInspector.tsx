// src/modules/DaliDesigner/Inspector/DaliInspector.tsx
import React from "react";
import { useAppSelector } from "@/store/hooks";
import {
  selectSelection,
  selectDeviceById,
} from "@/modules/DaliDesigner/store/daliSelectors";
import { DeviceInspector } from "@/modules/DaliDesigner/Inspector/DeviceInspector";
import { GroupInspector } from "@/modules/DaliDesigner/Inspector/GroupInspector";
import { SceneInspector } from "@/modules/DaliDesigner/Inspector/SceneInspector";
import { LineInspector } from "@/modules/DaliDesigner/Inspector/LineInspector";

export function DaliInspector() {
  const sel = useAppSelector(selectSelection);
  const device = useAppSelector((s) =>
    sel.deviceIds.length === 1 ? selectDeviceById(s, sel.deviceIds[0]) : null
  );

  return (
    <aside
      className="dali-inspector"
      style={{
        width: 300,
        flexShrink: 0,       // ← prevents the flex:1 canvas from compressing it
        minHeight: 0,        // ← allows vertical shrink in the flex parent
        overflowY: "auto",   // ← scrolls internally
        overflowX: "hidden",
        background: "#1e1e1e",
        borderLeft: "1px solid #333",
        padding: 8,
      }}
    >
      {device && <DeviceInspector device={device} />}
      {!device && sel.groupId && <GroupInspector groupId={sel.groupId} />}
      {!device && sel.sceneId && <SceneInspector sceneId={sel.sceneId} />}
      {!device && !sel.groupId && !sel.sceneId && (
        <LineInspector lineId={sel.lineId} />
      )}
    </aside>
  );
}