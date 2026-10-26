// src/modules/DaliDesigner/Inspector/GroupInspector.tsx
//
// LEVEL 1 LOCK ENFORCEMENT: rename, edit membership, and delete are
// disabled when the document is locked by another user. Browsing the
// group (seeing members, counts) remains enabled.

import React, { useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectGroups,
  selectDevices,
  selectSelection,
} from "@/modules/DaliDesigner/store/daliSelectors";
import {
  setAssignmentMode,
  setAssignmentSubMode,
  assignDevicesToGroup,
  removeDevicesFromGroup,
  deleteGroup,
  renameGroup,
} from "@/modules/DaliDesigner/store/daliSlice";
import { useDaliLockState } from "@/modules/DaliDesigner/hooks/useDaliLockState";

export function GroupInspector({ groupId }: { groupId: string }) {
  const dispatch = useAppDispatch();
  const groups = useAppSelector(selectGroups);
  const devices = useAppSelector(selectDevices);
  const selection = useAppSelector(selectSelection);
  const { isReadOnly, lockedByUsername } = useDaliLockState();

  const group = groups.find((g) => g.id === groupId);
  if (!group) return null;

  const members = useMemo(
    () => devices.filter((d) => d.groupIds.includes(groupId)),
    [devices, groupId]
  );
  const nonMembers = useMemo(
    () => devices.filter((d) => !d.groupIds.includes(groupId)),
    [devices, groupId]
  );

  const editing = !!selection.assignmentMode;
  const subMode = selection.assignmentSubMode ?? "add";

  const [pending, setPending] = useState<Set<string>>(new Set());

  const resetPending = () => setPending(new Set());

  const togglePending = (deviceId: string) => {
    setPending((prev) => {
      const next = new Set(prev);
      if (next.has(deviceId)) next.delete(deviceId);
      else next.add(deviceId);
      return next;
    });
  };

  const candidates = subMode === "add" ? nonMembers : members;
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
      dispatch(assignDevicesToGroup({ groupId, deviceIds: ids }));
    } else {
      dispatch(removeDevicesFromGroup({ groupId, deviceIds: ids }));
    }
    resetPending();
  };

  // ── View mode ─────────────────────────────────────────────────────
  if (!editing) {
    return (
      <div>
        <EditableGroupName
          groupId={groupId}
          currentName={group.name}
          isReadOnly={isReadOnly}
        />
        <div className="kv">
          <span>Members</span>
          <b>
            {members.length} / {devices.length}
          </b>
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
          {members.map((m) => (
            <li key={m.id} style={{ marginBottom: 4 }}>
              {m.label}
            </li>
          ))}
        </ul>

        <DeleteGroupButton
          groupId={groupId}
          groupName={group.name}
          isReadOnly={isReadOnly}
          lockedByUsername={lockedByUsername}
        />
      </div>
    );
  }

  // ── Edit mode (unreachable in read-only — beginEdit blocks it) ────
  const commitLabel =
    subMode === "add"
      ? `Add ${pendingList.length} to group`
      : `Remove ${pendingList.length} from group`;

  return (
    <div>
      <EditableGroupName
        groupId={groupId}
        currentName={group.name}
        isReadOnly={isReadOnly}
      />

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
              ? "Every device is already in this group."
              : "This group has no members."}
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

// ─── Editable group name ─────────────────────────────────────────────

function EditableGroupName({
  groupId,
  currentName,
  isReadOnly,
}: {
  groupId: string;
  currentName: string;
  isReadOnly: boolean;
}) {
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(currentName);

  const begin = () => {
    if (isReadOnly) return;
    setDraft(currentName);
    setEditing(true);
  };

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== currentName) {
      dispatch(renameGroup({ groupId, name: trimmed }));
    }
    setEditing(false);
  };

  const cancel = () => {
    setDraft(currentName);
    setEditing(false);
  };

  if (!editing) {
    return (
      <h3
        style={{
          ...panelHeaderStyle,
          cursor: isReadOnly ? "default" : "text",
          opacity: isReadOnly ? 0.75 : 1,
        }}
        onClick={begin}
        title={isReadOnly ? "Read-only: cannot rename a locked group" : "Click to rename"}
      >
        Group: {currentName}
      </h3>
    );
  }

  return (
    <div style={{ margin: "0 0 10px 0" }}>
      <input
        type="text"
        value={draft}
        autoFocus
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          }
        }}
        style={{
          width: "100%",
          padding: "4px 8px",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          background: "#0d0d0d",
          border: "1px solid #2563eb",
          borderRadius: 3,
          color: "#e2e8f0",
          outline: "none",
        }}
      />
    </div>
  );
}

// ─── Delete group control ─────────────────────────────────────────────

function DeleteGroupButton({
  groupId,
  groupName,
  isReadOnly,
  lockedByUsername,
}: {
  groupId: string;
  groupName: string;
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
        🔒 Delete group
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
        Delete group
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
        Delete "{groupName}"? Members will be unassigned from this group.
        The devices themselves are not deleted.
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={() => dispatch(deleteGroup(groupId))}
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

// ─── Styles (unchanged from original) ────────────────────────────────

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

export default GroupInspector;