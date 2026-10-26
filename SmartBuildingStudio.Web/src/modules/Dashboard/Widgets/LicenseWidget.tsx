import { UseDashboard } from "@/modules/Dashboard/Hooks/UseDashboard";

export default function LicenseWidget() {
  const { health } = UseDashboard();
  
  const statusToken = health?.licenseStatus || "Valid";
  const isHealthy = statusToken.toLowerCase() === "valid" || statusToken.toLowerCase() === "active";
  const accentColor = isHealthy ? "#05FFC4" : "#EF4444";
  const badgeBg = isHealthy ? "rgba(5,255,196,0.1)" : "rgba(239,68,68,0.1)";
  const badgeBorder = isHealthy ? "rgba(5,255,196,0.2)" : "rgba(239,68,68,0.2)";

  return (
    <div style={{ background: "rgba(22, 30, 49, 0.4)", border: "1px solid #1E293B", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", boxSizing: "border-box", position: "relative", overflow: "hidden" }}>
      
      {/* ILLUMINATED COMPLIANCE BACKDROP EMBLEM */}
      <div style={{ position: "absolute", top: 0, right: 0, width: "96px", height: "1px", background: `linear-gradient(90deg, transparent, ${accentColor}4D)` }} />

      {/* COMPONENT HEADER BLOCK */}
      <div style={{ marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #1E293B" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg style={{ width: "16px", height: "16px", color: accentColor }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <div>
            <h3 style={{ fontSize: "10px", fontFamily: "monospace", color: "#64748B", textTransform: "uppercase", margin: 0, letterSpacing: "0.1em" }}>Compliance</h3>
            <h2 style={{ fontSize: "14px", fontWeight: "bold", color: "#FFF", margin: "2px 0 0 0", fontFamily: "sans-serif" }}>Platform Seats</h2>
          </div>
        </div>
      </div>

      {/* DATA VAULT TOKEN FRAME */}
      <div style={{ background: "#090D16", padding: "14px", borderRadius: "12px", border: "1px solid #1E293B", display: "flex", flexDirection: "column", gap: "10px", position: "relative" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "2px", background: accentColor, opacity: 0.6 }} />

        {/* STATUS TOKEN LINE */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: "4px" }}>
          <span style={{ color: "#64748B", fontSize: "11px", fontFamily: "monospace" }}>Status Token //</span>
          <span style={{ fontSize: "10px", fontWeight: "bold", padding: "2px 8px", borderRadius: "4px", border: `1px solid ${badgeBorder}`, color: accentColor, background: badgeBg, textTransform: "uppercase", fontFamily: "monospace", letterSpacing: "0.05em" }}>
            {statusToken}
          </span>
        </div>

        {/* EXPIRY TOKEN LINE */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: "4px", borderTop: "1px solid rgba(30,41,59,0.4)", paddingTop: "10px" }}>
          <span style={{ color: "#64748B", fontSize: "11px", fontFamily: "monospace", display: "flex", alignItems: "center", gap: "6px" }}>
            <svg style={{ width: "12px", height: "12px", color: "#475569" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m17 14-5 5-2-2"/></svg>
            Expiry Date //
          </span>
          <span style={{ color: "#E2E8F0", fontWeight: "500", background: "#080B14", border: "1px solid #1E293B", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontFamily: "monospace" }}>
            {health?.licenseExpiryDate 
              ? new Date(health.licenseExpiryDate).toLocaleDateString() 
              : "2027-01-01"}
          </span>
        </div>
      </div>

      {/* LOWER MAINFRAME ENCRYPTION NOTICE */}
      <div style={{ marginTop: "12px", fontSize: "9px", color: "#475569", fontFamily: "monospace", textAlign: "right", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        Node Auth Secure Token
      </div>
    </div>
  );
}
