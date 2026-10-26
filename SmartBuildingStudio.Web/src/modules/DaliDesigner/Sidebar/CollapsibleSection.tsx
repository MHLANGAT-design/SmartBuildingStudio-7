// src/modules/DaliDesigner/Sidebar/CollapsibleSection.tsx
//
// Collapsible wrapper for sidebar sections.
//
// Persists its open/closed state in the Redux slice under
// `sidebarExpansion` so a section that was collapsed by the user stays
// collapsed across re-mounts (e.g. routing away from the canvas and
// back). If you'd rather not touch the slice, swap the two
// useAppSelector/useAppDispatch lines for a local useState — see the
// note at the bottom of this file.
//
// The header is a <button> rather than a clickable <h4> so keyboard
// users get Enter/Space for free and screen readers announce the
// expanded state correctly.

import React from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectSidebarExpansion } from "@/modules/DaliDesigner/store/daliSelectors";
import { toggleSidebarSection } from "@/modules/DaliDesigner/store/daliSlice";
import type { SidebarSectionKey } from "@/modules/DaliDesigner/store/daliTypes";

interface Props {
  sectionKey: SidebarSectionKey;
  title: string;
  count?: number;
  /** Optional hint line shown under the heading (the existing prose). */
  hint?: string;
  /** Start expanded if the slice has no entry for this key yet. */
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function CollapsibleSection({
  sectionKey,
  title,
  count,
  hint,
  defaultOpen = true,
  children,
}: Props) {
  const expansion = useAppSelector(selectSidebarExpansion);
  const dispatch = useAppDispatch();

  const open = expansion[sectionKey] ?? defaultOpen;

  return (
    <section className="sidebar-section">
      <button
        type="button"
        onClick={() => dispatch(toggleSidebarSection(sectionKey))}
        aria-expanded={open}
        style={headerStyle}
      >
        <span style={{ marginRight: 6, opacity: 0.7 }}>
          {open ? "▾" : "▸"}
        </span>
        <span style={{ fontWeight: 600 }}>{title}</span>
        {count != null && (
          <span style={{ marginLeft: 6, color: "#888", fontWeight: 400 }}>
            ({count})
          </span>
        )}
      </button>

      {open && (
        <div style={bodyStyle}>
          {hint && <div style={hintStyle}>{hint}</div>}
          {children}
        </div>
      )}
    </section>
  );
}

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  width: "100%",
  padding: "6px 4px",
  background: "transparent",
  border: "none",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  color: "#ddd",
  font: "inherit",
  fontSize: 12,
  cursor: "pointer",
  textAlign: "left",
};

const bodyStyle: React.CSSProperties = {
  paddingTop: 6,
};

const hintStyle: React.CSSProperties = {
  fontSize: 10,
  color: "#64748b",
  marginBottom: 8,
  lineHeight: 1.4,
};

export default CollapsibleSection;