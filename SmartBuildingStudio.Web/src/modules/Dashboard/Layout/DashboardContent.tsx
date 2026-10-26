import { UseDashboard } from "@/modules/Dashboard/Hooks/UseDashboard";
import WelcomeWidget from "@/modules/Dashboard/Widgets/WelcomeWidget";
import RecentProjectsWidget from "@/modules/Dashboard/Widgets/RecentProjectsWidget";
import RecentDocumentsWidget from "@/modules/Dashboard/Widgets/RecentDocumentsWidget";
import QuickLaunchWidget from "@/modules/Dashboard/Widgets/QuickLaunchWidget";
import ActivityWidget from "@/modules/Dashboard/Widgets/ActivityWidget";
import SystemHealthWidget from "@/modules/Dashboard/Widgets/SystemHealthWidget";

export default function DashboardContent() {
  const { loading, projects } = UseDashboard();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", paddingBottom: "48px", userSelect: "none", boxSizing: "border-box" }}>
      {/* TOP HERO LAYOUT MODULE BANNER */}
      <WelcomeWidget />

      {/* PRIMARY TELEMETRY FLEX LAYOUT MATRIX */}
      <div style={{ display: "flex", flexDirection: "row", gap: "24px", width: "100%", alignItems: "flex-start", flexWrap: "wrap" }}>

        {/* LEFT COLUMN SPAN: ACTIVE BLUEPRINTS MATRIX TRACKER (70% WIDTH) */}
        <div style={{ flex: "1 1 68%", minWidth: "320px", display: "flex", flexDirection: "column", gap: "24px", boxSizing: "border-box" }}>
          <RecentProjectsWidget />

          <div style={{ display: "flex", flexDirection: "row", gap: "24px", width: "100%", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 45%", minWidth: "240px" }}><RecentDocumentsWidget /></div>
            <div style={{ flex: "1 1 45%", minWidth: "240px" }}><QuickLaunchWidget /></div>
          </div>
        </div>

        {/* RIGHT COLUMN SPAN: OPERATIONAL DIAGNOSTICS & TELEMETRY STREAMS (30% WIDTH) */}
        <div style={{ flex: "1 1 28%", minWidth: "280px", display: "flex", flexDirection: "column", gap: "24px", boxSizing: "border-box" }}>
          <SystemHealthWidget />
          <ActivityWidget />
        </div>

      </div>

      {/* TACTICAL OVERLAY LOADER MASK DURING ACTIVE API FETCHES */}
      {loading && projects.length === 0 && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, backgroundColor: "rgba(8, 11, 20, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ backgroundColor: "#121826", border: "1px solid #1E293B", padding: "20px", borderRadius: "16px", display: "flex", alignItems: "center", gap: "14px", boxShadow: "0 0 50px rgba(0,0,0,0.8)", maxWidth: "384px", position: "relative", overflow: "hidden" }}>

            {/* Top decorative accent ribbon on loader box */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, #00D2FF, #05FFC4)", boxShadow: "0 1px 8px #05FFC4" }} />

            {/* Native SVG spinner bypassing lucide-react */}
            <svg style={{ width: "16px", height: "16px", color: "#00D2FF", animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>

            <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontFamily: "monospace", fontSize: "12px", textAlign: "left" }}>
              <span style={{ color: "#FFF", fontWeight: "bold", textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.05em" }}>Matrix Handshake Active</span>
              <span style={{ color: "#94A3B8", fontFamily: "sans-serif" }}>Synchronising platform systems matrices...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}