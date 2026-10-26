// src/modules/DaliDesigner/Sidebar/GroupExplorer.tsx
import React from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectGroups,
  selectDevices,
  selectSelection,
} from "@/modules/DaliDesigner/store/daliSelectors";
import { setSelection } from "@/modules/DaliDesigner/store/daliSlice";
import { CollapsibleSection } from "./CollapsibleSection";

export function GroupExplorer() {
  const groups = useAppSelector(selectGroups);
  const devices = useAppSelector(selectDevices);
  const selection = useAppSelector(selectSelection);
  const dispatch = useAppDispatch();

  return (
    <CollapsibleSection
      sectionKey="groups"
      title="Groups"
      count={groups.length}
      defaultOpen={false}
    >
      {groups.length === 0 && (
        <em style={{ opacity: 0.5, fontSize: 11 }}>No groups</em>
      )}

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {groups.map((g) => {
          const selected = selection.groupId === g.id;
          const memberCount = devices.filter((d) =>
            d.groupIds.includes(g.id)
          ).length;

          return (
            <li key={g.id} style={{ marginBottom: 2 }}>
              <button
                onClick={() =>
                  dispatch(
                    setSelection({
                      deviceIds: [],
                      groupId: g.id,
                      sceneId: undefined,
                    })
                  )
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "5px 8px",
                  borderRadius: 3,
                  background: selected ? "#1e3a5f" : "transparent",
                  border: "none",
                  borderLeftStyle: "solid",
                  borderLeftWidth: 3,
                  borderLeftColor: selected ? "#3b82f6" : "transparent",
                  color: selected ? "#e2e8f0" : "#94a3b8",
                  fontWeight: selected ? 600 : 400,
                  fontSize: 12,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.1s, border-color 0.1s",
                }}
              >
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {g.name}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: selected ? "#93c5fd" : "#64748b",
                    marginLeft: 8,
                    flexShrink: 0,
                  }}
                >
                  {memberCount}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </CollapsibleSection>
  );
}

export default GroupExplorer;