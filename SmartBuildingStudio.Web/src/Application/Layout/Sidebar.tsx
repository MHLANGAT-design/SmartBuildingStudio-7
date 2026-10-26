// src/Application/Layout/Sidebar.tsx
//
// Persistent left navigation — icon rail variant. 80px wide.
//
// Only lists pages that work standalone. Design tools (FPD, FPS, DALI)
// require document context that only Dashboard/ProjectExplorer provide,
// so they're not listed here — reached via those flows.
//
// Each icon has a tooltip for the full label. Active state = tinted pill.
// SBS brand mark stacked above a small "STUDIO" caption.

import React from 'react';
import { NavLink } from 'react-router-dom';

interface NavItem {
  to: string;
  label: string;
  matchExact?: boolean;
  icon: React.ReactNode;
}

// ─── Icons ──────────────────────────────────────────────────────────────────

const IconDashboard = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round"
       strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const IconExplorer = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round"
       strokeLinejoin="round" aria-hidden="true">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const IconManufacturers = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round"
       strokeLinejoin="round" aria-hidden="true">
    <path d="M3 21V8l6-4v4l6-4v4l6-4v17z" />
    <path d="M7 21v-4" />
    <path d="M11 21v-4" />
    <path d="M15 21v-4" />
  </svg>
);

// ─── Sections ───────────────────────────────────────────────────────────────

const SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Workbench',
    items: [
      { to: '/dashboard', label: 'Dashboard', matchExact: true, icon: IconDashboard },
      { to: '/explorer', label: 'Project Explorer', icon: IconExplorer },
    ],
  },
  {
    title: 'Admin',
    items: [
      { to: '/admin/manufacturers', label: 'Manufacturers', icon: IconManufacturers },
    ],
  },
];

// ─── Component ──────────────────────────────────────────────────────────────

export const Sidebar: React.FC = () => {
  return (
    <aside
      style={{
        width: 80,
        height: '100%',
        boxSizing: 'border-box',
        background: 'linear-gradient(180deg, #0D1420 0%, #070A12 100%)',
        borderRight: '1px solid #1E293B',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        flexShrink: 0,
        fontFamily: 'monospace',
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.35)',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {/* ─── Brand mark: SBS tile stacked above "STUDIO" caption ─── */}
      <div
        style={{
          padding: '14px 8px 12px',
          borderBottom: '1px solid #1E293B',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            background: '#111827',
            border: '1px solid #05FFC4',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px rgba(0, 210, 255, 0.25)',
          }}
          title="Smart Building Studio · Platform Hub v1.0"
        >
          <span
            style={{
              color: '#05FFC4',
              fontWeight: 900,
              fontSize: 11,
              fontFamily: 'monospace',
              letterSpacing: '0.05em',
            }}
          >
            SBS
          </span>
        </div>
        <div
          style={{
            fontSize: 7,
            fontFamily: 'monospace',
            color: '#64748B',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            textAlign: 'center',
            lineHeight: 1,
          }}
        >
          Studio
        </div>
      </div>

      {/* ─── Nav sections (icon-only, with tooltips) ─────────── */}
      {SECTIONS.map((section, idx) => (
        <div
          key={section.title}
          style={{
            padding: '10px 0 6px',
            borderTop: idx === 0 ? 'none' : '1px solid rgba(30, 41, 59, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: 7,
              fontWeight: 'bold',
              letterSpacing: '0.1em',
              color: '#475569',
              textTransform: 'uppercase',
              marginBottom: 2,
            }}
          >
            {section.title}
          </div>

          {section.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.matchExact}
              title={item.label}
              style={({ isActive }) => ({
                width: 44,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                color: isActive ? '#7DD3FC' : '#94A3B8',
                background: isActive
                  ? 'rgba(56, 189, 248, 0.12)'
                  : 'transparent',
                border: `1px solid ${
                  isActive ? 'rgba(56, 189, 248, 0.3)' : 'transparent'
                }`,
                textDecoration: 'none',
                transition:
                  'background 0.12s, color 0.12s, border-color 0.12s',
                position: 'relative',
              })}
              onMouseEnter={(e) => {
                if (!e.currentTarget.getAttribute('aria-current')) {
                  e.currentTarget.style.background =
                    'rgba(148, 163, 184, 0.08)';
                  e.currentTarget.style.color = '#E2E8F0';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.getAttribute('aria-current')) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#94A3B8';
                }
              }}
            >
              {({ isActive }) => (
                <>
                  {item.icon}
                  {isActive && (
                    <span
                      style={{
                        position: 'absolute',
                        left: 3,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 3,
                        height: 18,
                        borderRadius: 2,
                        background: '#7DD3FC',
                        boxShadow: '0 0 6px #7DD3FC',
                      }}
                      aria-hidden="true"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      ))}

      <div style={{ flex: 1 }} />

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <div
        style={{
          padding: '10px 8px',
          borderTop: '1px solid #1E293B',
          fontSize: 7,
          color: '#475569',
          letterSpacing: '0.08em',
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        v1.0
      </div>
    </aside>
  );
};

export default Sidebar;