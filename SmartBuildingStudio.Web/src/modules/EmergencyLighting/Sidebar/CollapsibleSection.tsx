// src/modules/EmergencyLighting/Sidebar/CollapsibleSection.tsx
//
// Collapsible wrapper for Emergency sidebar sections. Expansion state
// lives in emergency.sidebarExpansion, keyed by section, so a section
// collapsed by the user stays collapsed across re-mounts.

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { selectSidebarExpansion } from '@/modules/EmergencyLighting/store/emergencySelectors';
import { toggleSidebarSection } from '@/modules/EmergencyLighting/store/emergencySlice';
import type { EmergencySidebarSectionKey } from '@/modules/EmergencyLighting/store/emergencyTypes';

interface Props {
  sectionKey: EmergencySidebarSectionKey;
  title: string;
  count?: number;
  hint?: string;
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
    <section style={{ marginBottom: 2 }}>
      <button
        type="button"
        onClick={() => dispatch(toggleSidebarSection(sectionKey))}
        aria-expanded={open}
        style={headerStyle}
      >
        <span style={{ marginRight: 6, opacity: 0.7 }}>{open ? '▾' : '▸'}</span>
        <span style={{ fontWeight: 600 }}>{title}</span>
        {count != null && (
          <span style={{ marginLeft: 6, color: '#64748b', fontWeight: 400 }}>
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
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  padding: '6px 4px',
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  color: '#ddd',
  font: 'inherit',
  fontSize: 12,
  cursor: 'pointer',
  textAlign: 'left',
};

const bodyStyle: React.CSSProperties = {
  paddingTop: 6,
  paddingBottom: 6,
};

const hintStyle: React.CSSProperties = {
  fontSize: 10,
  color: '#64748b',
  marginBottom: 8,
  lineHeight: 1.4,
};

export default CollapsibleSection;