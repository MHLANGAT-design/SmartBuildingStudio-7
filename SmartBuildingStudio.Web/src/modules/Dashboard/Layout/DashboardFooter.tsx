import { UseDashboard } from "@/modules/Dashboard/Hooks/UseDashboard";

export default function DashboardFooter() {
  const { health } = UseDashboard();

  const usedMB = health ? Math.round(health.storageUsedBytes / 1024 / 1024) : 10240;
  const maxMB = health ? Math.round(health.storageMaxBytes / 1024 / 1024) : 51200;
  const storagePercentage = Math.min(100, Math.max(0, (usedMB / maxMB) * 100));

  const isHealthy = health?.licenseStatus === "Valid" || !health?.licenseStatus;
  const licenceColor = isHealthy ? "#05FFC4" : "#FFB800";

  // Dynamic progress track color matching your rules
  const progressColor = storagePercentage > 85
    ? "linear-gradient(90deg, #F43F5E, #DC2626)"
    : storagePercentage > 60
    ? "linear-gradient(90deg, #FFB800, #D97706)"
    : "linear-gradient(90deg, #00D2FF, #05FFC4)";

  return (
    <footer style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: "36px", background: "#080B14", borderTop: "1px solid #1E293B", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", boxSizing: "border-box", fontSize: "10px", fontFamily: "monospace", color: "#64748B", userSelect: "none", zIndex: 50, boxShadow: "0 -10px 30px rgba(0,0,0,0.5)" }}>

      {/* SYSTEM LICENSING COMPLIANCE METRICS */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: licenceColor, boxShadow: isHealthy ? `0 0 6px ${licenceColor}` : "none" }} />
          <span>Platform Licence:</span>
          <span style={{ fontWeight: "bold", textTransform: "uppercase", color: licenceColor, letterSpacing: "0.05em" }}>
            {health?.licenseStatus || "ENTERPRISE"}
          </span>
        </div>

        <span style={{ color: "#1E293B" }}>|</span>

        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <svg style={{ width: "12px", height: "12px", color: "#475569" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span>Renewal:</span>
          <span style={{ color: "#94A3B8" }}>
            {health?.licenseExpiryDate ? new Date(health.licenseExpiryDate).toLocaleDateString() : "2027-01-01"}
          </span>
        </div>
      </div>

      {/* CLOUD SERVICE LAYER ALLOCATIONS BAR */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg style={{ width: "12px", height: "12px", color: "#475569" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2"/><rect width="6" height="16" x="2" y="4"/></svg>
          <span>Cloud Storage:</span>

          {/* Dynamic Horizontal Ribbon Bar */}
          <div style={{ width: "112px", height: "6px", borderRadius: "3px", background: "#090D16", border: "1px solid #1E293B", overflow: "hidden", display: "inline-flex", boxSizing: "border-box" }}>
            <div
              style={{ width: `${storagePercentage}%`, height: "100%", borderRadius: "3px", background: progressColor, boxShadow: "0 0 8px rgba(0,210,255,0.3)", transition: "width 0.5s ease-out" }}
            />
          </div>

          <span style={{ color: "#E2E8F0", fontWeight: "bold" }}>{storagePercentage.toFixed(0)}%</span>
          <span style={{ color: "#475569" }}>({usedMB}MB / {maxMB}MB)</span>
        </div>

        <span style={{ width: "1px", height: "10px", background: "#1E293B" }} />

        {/* DATABASE ACTIVE THREADS COUNTER */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <svg style={{ width: "12px", height: "12px", color: "#475569" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3"/></svg>
          <span>Active Threads:</span>
          <span style={{ color: "#00D2FF", fontWeight: "bold" }}>
            {health?.activeBackgroundJobs || 2} Task Threads
          </span>
        </div>
      </div>

    </footer>
  );
}