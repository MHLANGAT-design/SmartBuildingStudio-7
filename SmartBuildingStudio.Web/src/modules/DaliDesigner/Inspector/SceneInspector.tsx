// src/modules/DaliDesigner/Inspector/SceneInspector.tsx
//
// LEVEL 1 LOCK ENFORCEMENT: all scene edits (bulk buttons, sliders)
// disabled when the document is locked by another user. Viewing the
// scene composition (which devices, current levels) remains enabled.

import React from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectScenes,
  selectDevices,
} from "@/modules/DaliDesigner/store/daliSelectors";
import {
  setSceneLevel,
  setSceneLevels,
} from "@/modules/DaliDesigner/store/daliThunks";
import { useDaliLockState } from "@/modules/DaliDesigner/hooks/useDaliLockState";

export function SceneInspector({ sceneId }: { sceneId: string }) {
  const dispatch = useAppDispatch();
  const scenes = useAppSelector(selectScenes);
  const devices = useAppSelector(selectDevices);
  const { isReadOnly, lockedByUsername } = useDaliLockState();

  const scene = scenes.find((s) => s.id === sceneId);
  if (!scene) return null;

  const handleSetLevel = (deviceId: string, level: number) => {
    if (isReadOnly) return;
    dispatch(setSceneLevel({ sceneId, deviceId, level }));
  };

  const setAll = (level: number) => {
    if (isReadOnly) return;
    const levels: Record<string, number> = {};
    devices.forEach((d) => {
      levels[d.id] = level;
    });
    dispatch(setSceneLevels({ sceneId, levels }));
  };

  const clearAll = () => setAll(0);

  const assignedCount = Object.values(scene.levels).filter(
    (l) => l > 0
  ).length;

  return (
    <div>
      <h3>Scene: {scene.name}</h3>

      {isReadOnly && (
        <div
          style={{
            fontSize: 10,
            color: "#FFB800",
            background: "rgba(255, 184, 0, 0.12)",
            border: "1px solid rgba(255, 184, 0, 0.4)",
            borderRadius: 4,
            padding: "6px 8px",
            marginBottom: 8,
            fontFamily: "monospace",
            fontWeight: "bold",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
          title={`Locked by ${lockedByUsername || "another user"}`}
        >
          🔒 Read-only — scene levels can't be edited
        </div>
      )}

      <div className="kv">
        <span>Devices in scene</span>
        <b>
          {assignedCount} / {devices.length}
        </b>
      </div>

      <div style={{ display: "flex", gap: 6, margin: "8px 0" }}>
        <button
          className="tb-btn"
          onClick={() => setAll(254)}
          disabled={isReadOnly}
          title={isReadOnly ? "Read-only" : undefined}
          style={{
            opacity: isReadOnly ? 0.45 : 1,
            cursor: isReadOnly ? "not-allowed" : "pointer",
          }}
        >
          All Full
        </button>
        <button
          className="tb-btn"
          onClick={() => setAll(127)}
          disabled={isReadOnly}
          title={isReadOnly ? "Read-only" : undefined}
          style={{
            opacity: isReadOnly ? 0.45 : 1,
            cursor: isReadOnly ? "not-allowed" : "pointer",
          }}
        >
          All 50%
        </button>
        <button
          className="tb-btn"
          onClick={clearAll}
          disabled={isReadOnly}
          title={isReadOnly ? "Read-only" : undefined}
          style={{
            opacity: isReadOnly ? 0.45 : 1,
            cursor: isReadOnly ? "not-allowed" : "pointer",
          }}
        >
          Clear
        </button>
      </div>

      <div className="device-scene-levels" style={{ marginTop: 12 }}>
        {devices.map((d) => {
          const level = scene.levels[d.id] ?? 0;
          const pct = Math.round((level / 254) * 100);
          return (
            <div
              key={d.id}
              className="kv kv-small"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
              }}
            >
              <label
                htmlFor={`slider-${scene.id}-${d.id}`}
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={d.label}
              >
                {d.label}
              </label>
              <input
                id={`slider-${scene.id}-${d.id}`}
                type="range"
                min={0}
                max={254}
                value={level}
                disabled={isReadOnly}
                onChange={(e) =>
                  handleSetLevel(d.id, Number(e.target.value))
                }
                style={{
                  width: 110,
                  opacity: isReadOnly ? 0.45 : 1,
                  cursor: isReadOnly ? "not-allowed" : "pointer",
                }}
              />
              <span
                style={{
                  width: 40,
                  textAlign: "right",
                  fontFamily: "monospace",
                  fontSize: 11,
                  opacity: isReadOnly ? 0.6 : 1,
                }}
              >
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SceneInspector;