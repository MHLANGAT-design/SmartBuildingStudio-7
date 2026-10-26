// src/modules/DaliDesigner/Sidebar/DeviceTree.tsx
//
// Sidebar device tree.
//
// Renders devices grouped by DALI line assignment:
//   - One subsection per DALI line (devices whose lineId matches)
//   - One "No line assigned" subsection for devices with lineId === null
//
// This tree is scoped to *bus* assignment. Group membership is a
// separate relation shown in GroupExplorer; the two are orthogonal,
// and the heading + hint below make that explicit so "No line assigned"
// is not misread as "unassigned to anything".
//
// Clicking a device dispatches setSelection({ deviceIds: [id] }) so
// the Inspector shows its details. The dispatch also clears the other
// selection kinds (lineId / groupId / sceneId) — the four selection
// kinds are mutually exclusive by design, and this is one of the sites
// that enforces that invariant. Each sidebar panel that sets its own
// selection kind clears the others; see DaliLineExplorer for the
// corresponding line-selection case.

import React from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectLines,
  selectDevices,
  selectSelection,
} from "@/modules/DaliDesigner/store/daliSelectors";
import { setSelection } from "@/modules/DaliDesigner/store/daliSlice";
import { CollapsibleSection } from "./CollapsibleSection";

export function DeviceTree() {
  const lines = useAppSelector(selectLines);
  const devices = useAppSelector(selectDevices);
  const selection = useAppSelector(selectSelection);
  const dispatch = useAppDispatch();

  const unassigned = devices.filter((d) => !d.lineId);
  const selectedIds = new Set(selection.deviceIds);

  const renderDeviceButton = (d: (typeof devices)[number]) => {
    const selected = selectedIds.has(d.id);
    const addrLabel =
      d.address != null ? `#${String(d.address).padStart(3, "0")} ` : "";
    return (
      <li key={d.id}>
        <button
          className="link"
          onClick={() =>
            dispatch(
              setSelection({
                deviceIds: [d.id],
                lineId: undefined,
                groupId: undefined,
                sceneId: undefined,
              })
            )
          }
          style={{
            color: selected ? "#7DD3FC" : undefined,
            fontWeight: selected ? 600 : undefined,
          }}
        >
          {addrLabel}
          {d.label}
        </button>
      </li>
    );
  };

  return (
    <CollapsibleSection
      sectionKey="devices"
      title="Devices by line"
      count={devices.length}
      hint="Grouped by DALI line. Group membership is in the Groups section below."
      defaultOpen={false}
    >
      {/* ── One subsection per DALI line ────────────────────────── */}
      {lines.map((l) => {
        const members = devices.filter((d) => d.lineId === l.id);
        return (
          <div key={l.id}>
            <div className="tree-line">
              {l.name}{" "}
              <small style={{ color: "#888" }}>
                ({members.length})
              </small>
            </div>
            {members.length === 0 ? (
              <em style={{ opacity: 0.5, fontSize: 11 }}>No devices yet</em>
            ) : (
              <ul>{members.map(renderDeviceButton)}</ul>
            )}
          </div>
        );
      })}

      {/* ── Devices with no line assignment ───────────────────────── */}
      {unassigned.length > 0 && (
        <div>
          <div className="tree-line">
            No line assigned{" "}
            <small style={{ color: "#888" }}>({unassigned.length})</small>
          </div>
          <ul>{unassigned.map(renderDeviceButton)}</ul>
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────── */}
      {devices.length === 0 && (
        <em style={{ opacity: 0.5, fontSize: 11 }}>No devices loaded</em>
      )}
    </CollapsibleSection>
  );
}