// src/modules/Dashboard/Widgets/QuickLaunchWidget.tsx

import { useNavigate } from "react-router-dom";

interface ModuleEntry {
  name: string;
  shortLabel: string;
  path: string;
  icon: string;
  accent: string;
  disabled?: boolean;
}

export default function QuickLaunchWidget() {
  const navigate = useNavigate();

  const modules: ModuleEntry[] = [
    {
      name: "Project Explorer",
      shortLabel: "Explore",
      path: "/explorer",
      icon: "📁",
      accent: "#3B82F6",
    },
    {
      name: "Floor Plan Designer",
      shortLabel: "Floor Plans",
      path: "/explorer?intent=floorplans",
      icon: "🏢",
      accent: "#05FFC4",
    },
    {
      name: "Fixture Placement Studio",
      shortLabel: "Fixtures",
      path: "/explorer?intent=fixtures",
      icon: "💡",
      accent: "#F59E0B",
    },
    {
      name: "DALI Designer",
      shortLabel: "DALI",
      path: "/explorer?intent=dali",
      icon: "⚡",
      accent: "#8B5CF6",
    },
    {
      name: "DALI Programming",
      shortLabel: "Program",
      path: "/explorer?intent=programming",
      icon: "🔧",
      accent: "#22C55E",
    },
    {
      name: "Emergency Lighting",
      shortLabel: "Emergency",
      path: "/explorer?intent=emergency",
      icon: "🚨",
      accent: "#F43F5E",
    },
    {
      name: "Compliance Reports Panel",
      shortLabel: "Reports",
      path: "/reports",
      icon: "📊",
      accent: "#14B8A6",
      disabled: true,
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
      }}
    >
      {modules.map((mod) => (
        <button
          key={mod.name}
          onClick={() => {
            if (!mod.disabled) {
              console.log(`Routing to platform module: ${mod.path}`);
              navigate(mod.path);
            }
          }}
          disabled={mod.disabled}
          title={mod.name}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "6px 14px 6px 6px",
            background: `${mod.accent}14`,
            border: `1px solid ${mod.accent}40`,
            borderRadius: 10,
            color: "#E2E8F0",
            fontFamily: "monospace",
            fontSize: 11,
            fontWeight: 600,
            cursor: mod.disabled ? "not-allowed" : "pointer",
            opacity: mod.disabled ? 0.4 : 1,
            whiteSpace: "nowrap",
            transition:
              "background 0.15s, border-color 0.15s, color 0.15s, transform 0.1s",
          }}
          onMouseEnter={(e) => {
            if (!mod.disabled) {
              e.currentTarget.style.background = `${mod.accent}28`;
              e.currentTarget.style.borderColor = mod.accent;
              e.currentTarget.style.color = mod.accent;
            }
          }}
          onMouseLeave={(e) => {
            if (!mod.disabled) {
              e.currentTarget.style.background = `${mod.accent}14`;
              e.currentTarget.style.borderColor = `${mod.accent}40`;
              e.currentTarget.style.color = "#E2E8F0";
            }
          }}
        >
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: mod.accent,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              lineHeight: 1,
              flexShrink: 0,
              boxShadow: mod.disabled ? "none" : `0 0 8px ${mod.accent}60`,
            }}
            aria-hidden="true"
          >
            {mod.icon}
          </span>

          <span>{mod.shortLabel}</span>
        </button>
      ))}
    </div>
  );
}