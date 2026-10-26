// src/modules/DaliDesigner/Sidebar/DaliLineExplorer.tsx
//
// LEVEL 1 LOCK ENFORCEMENT: the ✕ delete button is disabled when the
// document is locked by another user. Selection (clicking a line name)
// remains enabled — that's a read operation.

import React from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectLines,
  selectDevices,
  selectSelection,
} from "@/modules/DaliDesigner/store/daliSelectors";
import { removeDaliLine } from "@/modules/DaliDesigner/store/daliThunks";
import { setSelection } from "@/modules/DaliDesigner/store/daliSlice";
import { useDaliLockState } from "@/modules/DaliDesigner/hooks/useDaliLockState";
import { CollapsibleSection } from "./CollapsibleSection";

export function DaliLineExplorer() {
  const lines = useAppSelector(selectLines);
  const devices = useAppSelector(selectDevices);
  const selection = useAppSelector(selectSelection);
  const dispatch = useAppDispatch();
  const { isReadOnly, lockedByUsername } = useDaliLockState();

  const selectedLineId = selection.lineId;

  return (
    <CollapsibleSection
      sectionKey="lines"
      title="DALI lines"
      count={lines.length}
      hint="Physical bus segments. Each device is on at most one line."
      defaultOpen
    >
      {lines.length === 0 && (
        <em style={{ opacity: 0.5, fontSize: 11 }}>No lines</em>
      )}

      <ul style={{ listStyle: "none", paddingLeft: 6, margin: 0 }}>
        {lines.map((l) => {
          const count = devices.filter((d) => d.lineId === l.id).length;
          const selected = selectedLineId === l.id;
          return (
            <li
              key={l.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  dispatch(
                    setSelection({
                      lineId: l.id,
                      deviceIds: [],
                      groupId: undefined,
                      sceneId: undefined,
                    })
                  );
                }}
                style={{
                  flex: 1,
                  textAlign: "left",
                  padding: "3px 6px",
                  fontSize: 11,
                  color: selected ? "#7DD3FC" : "#94a3b8",
                  fontWeight: selected ? 600 : 400,
                  background: selected
                    ? "rgba(56, 189, 248, 0.08)"
                    : "transparent",
                  border: "none",
                  borderRadius: 3,
                  cursor: "pointer",
                }}
              >
                {l.name}{" "}
                <small style={{ color: "#64748b" }}>
                  ({count} {count === 1 ? "device" : "devices"})
                </small>
              </button>
              <button
                type="button"
                title={
                  isReadOnly
                    ? `Read-only: cannot delete a locked document's lines`
                    : `Delete ${l.name}`
                }
                disabled={isReadOnly}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isReadOnly) return;
                  if (count > 0) {
                    const ok = window.confirm(
                      `Delete "${l.name}"? ${count} device(s) will be ` +
                        `unassigned and lose their addresses.`
                    );
                    if (!ok) return;
                  }
                  if (selectedLineId === l.id) {
                    dispatch(setSelection({ lineId: undefined }));
                  }
                  dispatch(removeDaliLine(l.id));
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: isReadOnly ? "#334155" : "#64748b",
                  cursor: isReadOnly ? "not-allowed" : "pointer",
                  padding: "0 4px",
                  fontSize: 12,
                  lineHeight: 1,
                  flexShrink: 0,
                  opacity: isReadOnly ? 0.4 : 1,
                }}
                onMouseEnter={(e) => {
                  if (isReadOnly) return;
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "#EF4444";
                }}
                onMouseLeave={(e) => {
                  if (isReadOnly) return;
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "#64748b";
                }}
              >
                ✕
              </button>
            </li>
          );
        })}
      </ul>
    </CollapsibleSection>
  );
}