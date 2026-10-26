// src/modules/DaliDesigner/Inspector/LineInspector.tsx
//
// LEVEL 1 LOCK ENFORCEMENT: edit membership and delete line are
// disabled when the document is locked by another user.

import React, { useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectLines,
  selectDevices,
  selectSelection,
} from "@/modules/DaliDesigner/store/daliSelectors";
import {
  setAssignmentMode,
  setAssignmentSubMode,
} from "@/modules/DaliDesigner/store/daliSlice";
import {
  assignDeviceToLine,
  removeDaliLine,
} from "@/modules/DaliDesigner/store/daliThunks";
import { useDaliLockState } from "@/modules/DaliDesigner/hooks/useDaliLockState";

interface Props {
  lineId?: string;
}

export function LineInspector({ lineId }: Props) {
  const dispatch = useAppDispatch();
  const lines = useAppSelector(selectLines);
  const devices = useAppSelector(selectDevices);
  const selection = useAppSelector(selectSelection);
  const { isReadOnly, lockedByUsername } = useDaliLockState();

  const line = useMemo(() => {
    if (!lineId) return undefined;
    return lines.find((l) => l.id === lineId);
  }, [lines, lineId]);

  const assigned = useMemo(
    () => (line ? devices.filter((d) => d.lineId === line.id) : []),
    [devices, line]
  );

  const unassigned = useMemo(
    () => devices.filter((d) => !d.lineId),
    [devices]
  );

  const [pending, setPending] = useState<Set<string>>(new Set());

  if (!lineId) {
    return (
      <div>
        <h3 style={panelHeaderStyle}>Lines</h3>
        {lines.length === 0 && (
          <em style={{ opacity: 0.5, fontSize: 11 }}>No lines</em>
        )}
        {lines.map((l) => {
          const count = devices.filter((d) => d.lineId === l.id).length;
          return (
            <fieldset key={l.id}>
              <legend>{l.name}</legend>
              <div className="kv">
                <span>Devices</span>
                <b>{count}/{l.maxDevices}</b>
              </div>
              <div className="kv">
                <span>PSU capacity</span>
                <b>{l.powerBudgetW} W</b>
              </div>
            </fieldset>
          );
        })}
      </div>
    );
  }

  if (!line) {
    return (
      <div>
        <h3>Line</h3>
        <em style={{ opacity: 0.5, fontSize: 11 }}>
          Line not found (it may have been deleted).
        </em>
      </div>
    );
  }

  const editing = !!selection.assignmentMode;
  const subMode = selection.assignmentSubMode ?? "add";

  const resetPending = () => setPending(new Set());

  const togglePending = (deviceId: string) => {
    setPending((prev) => {
      const next = new Set(prev);
      if (next.has(deviceId)) next.delete(deviceId);
      else next.add(deviceId);
      return next;
    });
  };

  const candidates = subMode === "add" ? unassigned : assigned;
  const pendingList = candidates.filter((d) => pending.has(d.id));

  const beginEdit = () => {
    if (isReadOnly) return;
    dispatch(setAssignmentMode(true));
    dispatch(setAssignmentSubMode("add"));
    resetPending();
  };

  const cancelEdit = () => {
    dispatch(setAssignmentMode(false));
    resetPending();
  };

  const doneEdit = () => {
    dispatch(setAssignmentMode(false));
    resetPending();
  };

  const switchSubMode = (mode: "add" | "remove") => {
    dispatch(setAssignmentSubMode(mode));
    resetPending();
  };

  const commit = () => {
    if (isReadOnly) return;
    if (pendingList.length === 0) return;
    const ids = pendingList.map((d) => d.id);
    if (subMode === "add") {
      dispatch(assignDeviceToLine({ deviceIds: ids, lineId: line.id }));
    } else {
      dispatch(assignDeviceToLine({ deviceIds: ids, lineId: null }));
    }
    resetPending();
  };

  if (!editing) {
    return (
      <div>
        <h3 style={panelHeaderStyle}>Line: {line.name}</h3>

        <div className="kv">
          <span>Devices</span>
          <b>{assigned.length}/{line.maxDevices}</b>
        </div>
        <div className="kv">
          <span>PSU capacity</span>
          <b>{line.powerBudgetW} W</b>
        </div>

        <button
          className="tb-btn"
          onClick={beginEdit}
          disabled={isReadOnly}
          title={
            isReadOnly
              ? `Read-only: locked by ${lockedByUsername || "another user"}`
              : undefined
          }
          style={{
            marginTop: 8,
            width: "100%",
            opacity: isReadOnly ? 0.45 : 1,
            cursor: isReadOnly ? "not-allowed" : "pointer",
          }}
        >
          {isReadOnly ? "🔒 Edit membership" : "Edit membership"}
        </button>

        <ul style={{ marginTop: 12, paddingLeft: 18 }}>
          {assigned.map((d) => (
            <li key={d.id} style={{ marginBottom: 4 }}>
              {d.address != null
                ? `#${String(d.address).padStart(3, "0")} `
                : ""}
              {d.label}
            </li>
          ))}
        </ul>

        <DeleteLineButton
          lineId={line.id}
          lineName={line.name}
          assignedCount={assigned.length}
          isReadOnly={isReadOnly}
          lockedByUsername={lockedByUsername}
        />
      </div>
    );
  }

  const commitLabel =
    subMode === "add"
      ? `Add ${pendingList.length} to line`
      : `Remove ${pendingList.length} from line`;

  return (
    <div>
      <h3 style={panelHeaderStyle}>Line: {line.name}</h3>

      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        <button
          onClick={() => switchSubMode("add")}
          style={subMode === "add" ? tabActiveStyle : tabStyle}
        >
          Add
        </button>
        <button
          onClick={() => switchSubMode("remove")}
          style={subMode === "remove" ? tabActiveStyle : tabStyle}
        >
          Remove
        </button>
      </div>

      <div style={hintStyle}>
        1. Tick devices below or click them on the canvas.
        <br />
        2. Press the orange button to commit.
        <br />
        3. Press Done when finished.
      </div>

      <div className="kv kv-small" style={{ marginTop: 8 }}>
        <span>
          {subMode === "add" ? "Available devices" : "Current members"}
        </span>
        <b>{candidates.length}</b>
      </div>

      <div style={candidateListStyle}>
        {candidates.length === 0 && (
          <div style={{ color: "#666", fontSize: 11, padding: 6 }}>
            {subMode === "add"
              ? "Every device is already on this line."
              : "This line has no members."}
          </div>
        )}
        {candidates.map((d) => {
          const checked = pending.has(d.id);
          return (
            <label
              key={d.id}
              style={{
                ...candidateRowStyle,
                background: checked
                  ? "rgba(251, 146, 60, 0.15)"
                  : "transparent",
                borderColor: checked
                  ? "rgba(251, 146, 60, 0.5)"
                  : "transparent",
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => togglePending(d.id)}
              />
              <span
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
              </span>
            </label>
          );
        })}
      </div>

      <div style={{ marginTop: 10 }}>
        <button
          onClick={commit}
          disabled={pendingList.length === 0 || isReadOnly}
          style={
            pendingList.length === 0 || isReadOnly
              ? commitDisabledStyle
              : commitActiveStyle
          }
        >
          {commitLabel}
        </button>
      </div>

      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <button className="tb-btn" onClick={cancelEdit} style={{ flex: 1 }}>
          Cancel
        </button>
        <button className="tb-btn" onClick={doneEdit} style={{ flex: 1 }}>
          Done
        </button>
      </div>
    </div>
  );
}

// ─── Delete line control ─────────────────────────────────────────────

function DeleteLineButton({
  lineId,
  lineName,
  assignedCount,
  isReadOnly,
  lockedByUsername,
}: {
  lineId: string;
  lineName: string;
  assignedCount: number;
  isReadOnly: boolean;
  lockedByUsername: string | null;
}) {
  const dispatch = useAppDispatch();
  const [armed, setArmed] = useState(false);

  if (isReadOnly) {
    return (
      <button
        disabled
        title={`Read-only: locked by ${lockedByUsername || "another user"}`}
        style={{
          marginTop: 16,
          width: "100%",
          padding: "6px 10px",
          fontSize: 11,
          background: "transparent",
          border: "1px solid #1e293b",
          borderRadius: 3,
          color: "#334155",
          cursor: "not-allowed",
          opacity: 0.4,
        }}
      >
        🔒 Delete line
      </button>
    );
  }

  if (!armed) {
    return (
      <button
        onClick={() => setArmed(true)}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#7f1d1d";
          e.currentTarget.style.color = "#f87171";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#3f3f46";
          e.currentTarget.style.color = "#71717a";
        }}
        style={{
          marginTop: 16,
          width: "100%",
          padding: "6px 10px",
          fontSize: 11,
          background: "transparent",
          border: "1px solid #3f3f46",
          borderRadius: 3,
          color: "#71717a",
          cursor: "pointer",
          transition: "border-color 0.15s, color 0.15s",
        }}
      >
        Delete line
      </button>
    );
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div
        style={{
          fontSize: 10,
          color: "#fca5a5",
          marginBottom: 6,
          lineHeight: 1.4,
        }}
      >
        Delete "{lineName}"?
        {assignedCount > 0
          ? ` ${assignedCount} device(s) will be unassigned and lose their addresses.`
          : " This line has no devices."}
        The devices themselves are not deleted.
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={() => dispatch(removeDaliLine(lineId))}
          style={{
            flex: 1,
            padding: "6px 10px",
            fontSize: 11,
            fontWeight: 700,
            background: "#dc2626",
            border: "1px solid #ef4444",
            borderRadius: 3,
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Yes, delete
        </button>
        <button
          onClick={() => setArmed(false)}
          className="tb-btn"
          style={{ flex: 1 }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────

const panelHeaderStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: "#cbd5e1",
  borderBottom: "1px solid #333",
  paddingBottom: 6,
  margin: "0 0 10px 0",
};

const tabStyle: React.CSSProperties = {
  flex: 1,
  padding: "5px 10px",
  fontSize: 11,
  background: "#18181b",
  border: "1px solid #333",
  borderRadius: 3,
  color: "#94a3b8",
  cursor: "pointer",
};

const tabActiveStyle: React.CSSProperties = {
  ...tabStyle,
  background: "#1e3a5f",
  borderColor: "#2563eb",
  color: "#e2e8f0",
  fontWeight: 600,
};

const hintStyle: React.CSSProperties = {
  fontSize: 10,
  color: "#94a3b8",
  background: "#0f172a",
  border: "1px solid #1e293b",
  borderRadius: 3,
  padding: "6px 8px",
  lineHeight: 1.5,
};

const candidateListStyle: React.CSSProperties = {
  maxHeight: 240,
  overflowY: "auto",
  border: "1px solid #333",
  borderRadius: 3,
  padding: 4,
  marginTop: 4,
  background: "#0d0d0d",
};

const candidateRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "3px 6px",
  fontSize: 11,
  cursor: "pointer",
  borderRadius: 3,
  border: "1px solid transparent",
  transition: "background 0.1s, border-color 0.1s",
};

const commitActiveStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.03em",
  background: "#f97316",
  border: "1px solid #fb923c",
  borderRadius: 3,
  color: "#0b0f19",
  cursor: "pointer",
  textTransform: "uppercase",
};

const commitDisabledStyle: React.CSSProperties = {
  ...commitActiveStyle,
  background: "#3f3f46",
  borderColor: "#52525b",
  color: "#71717a",
  cursor: "not-allowed",
  fontWeight: 500,
};

export default LineInspector;