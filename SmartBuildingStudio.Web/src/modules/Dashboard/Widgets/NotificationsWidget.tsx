import { useState, useCallback } from "react";

export default function NotificationsWidget() {
  const [isMuted, setIsMuted] = useState(false);
  
  // 🚀 FIXED: Transformed static configuration array into an active interactive state bucket!
  const [alerts, setAlerts] = useState([
    { id: "al-01", title: "DALI Subnet Loop Overflow", type: "Error", text: "Subnet Line B exceeds 64 connected ballasts maximum load.", time: "10m ago" },
    { id: "al-02", title: "Licence Impending Expiry", type: "Warning", text: "Enterprise seat allocation renewal required in 14 days.", time: "2h ago" }
  ]);

  // 🚀 FIXED ACTION: Quietly clear an individual notification item from the queue list
  const handleDismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((al) => al.id !== id));
  }, []);

  // 🚀 FIXED ACTION: Clear down the complete active system alert deck at once
  const handleClearAll = useCallback(() => {
    setAlerts([]);
  }, []);
  return (
    <div style={{ background: "rgba(22, 30, 49, 0.4)", border: "1px solid #1E293B", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", boxSizing: "border-box", position: "relative", overflow: "hidden" }}>
      
      {/* CORNER TECH SHIELD DECORATION */}
      <div style={{ position: "absolute", top: 0, right: 0, width: "96px", height: "1px", background: "linear-gradient(90deg, transparent, rgba(239,68,68,0.2))" }} />

      {/* ALERT STREAM HEADER BLOCK */}
      <div style={{ marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #1E293B", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg style={{ width: "16px", height: "16px", color: "#F43F5E" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          <div>
            <h3 style={{ fontSize: "10px", fontFamily: "monospace", color: "#64748B", textTransform: "uppercase", margin: 0, letterSpacing: "0.1em" }}>Alert Center</h3>
            <h2 style={{ fontSize: "14px", fontWeight: "bold", color: "#FFF", margin: "2px 0 0 0", fontFamily: "sans-serif" }}>Platform Notifications</h2>
          </div>
        </div>
        {/* Dynamic target index counter updates live */}
        <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#F43F5E", background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.2)", padding: "2px 8px", borderRadius: "6px", fontWeight: "bold" }}>
          {alerts.length} TARGETS
        </span>
      </div>

      {/* LOG STREAM FEED */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {alerts.map((al) => {
          const isError = al.type === "Error";
          const statusColor = isError ? "#F43F5E" : "#FFB800";
          
          return (
            <div 
              key={al.id} 
              style={{ padding: "14px", background: "#0A0F1D", border: "1px solid #1E293B", borderLeft: `3px solid ${statusColor}`, borderRadius: "0 12px 12px 0", display: "flex", flexDirection: "column", gap: "6px", position: "relative" }}
            >
              {/* TOP HEADER SUB-ROW */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", gap: "12px" }}>
                <span style={{ fontWeight: "600", display: "flex", alignItems: "center", gap: "6px", color: statusColor, fontFamily: "sans-serif" }}>
                  <svg style={{ width: "14px", height: "14px" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  {al.title}
                </span>
                
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "10px", color: "#64748B", fontFamily: "monospace", display: "flex", alignItems: "center", gap: "4px" }}>
                    <svg style={{ width: "11px", height: "11px", color: "#475569" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {al.time}
                  </span>
                  {/* 🚀 FIXED ACTION: Individual item cancel cross button */}
                  <button 
                    type="button" 
                    onClick={() => handleDismissAlert(al.id)}
                    style={{ background: "none", border: "none", color: "#475569", fontSize: "11px", cursor: "pointer", padding: 0, outline: "none" }}
                    title="Dismiss alert row"
                    className="hover:text-slate-200"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              {/* DESCRIPTION BLOCK */}
              <p style={{ fontSize: "11px", color: "#94A3B8", margin: "0 0 0 20px", fontFamily: "sans-serif", lineHeight: "1.5" }}>
                {al.text}
              </p>
            </div>
          );
        })}

        {alerts.length === 0 && (
          <div style={{ padding: "32px 0", textAlign: "center", border: "1px dashed #1E293B", borderRadius: "12px", background: "rgba(9,13,22,0.2)", fontFamily: "monospace", color: "#64748B" }}>
            No operational logs pending.
          </div>
        )}
      </div>

      {/* 🚀 FIXED FOOTER PLATFORM BUTTON MANAGEMENT DECK */}
      <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #1E293B", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Mute monitor alert audio toggle checkbox status handle */}
        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", fontFamily: "monospace", color: "#64748B", cursor: "pointer", userSelect: "none" }}>
          <input 
            type="checkbox" 
            checked={isMuted} 
            onChange={(e) => setIsMuted(e.target.checked)} 
            style={{ accentColor: "#F43F5E", cursor: "pointer" }}
          />
          <span>{isMuted ? "🔇 Audio Muted" : "🔊 Audio On"}</span>
        </label>
        
        {alerts.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            style={{ background: "none", border: "1px solid #1E293B", padding: "4px 10px", borderRadius: "6px", color: "#64748B", fontSize: "10px", fontFamily: "monospace", cursor: "pointer", transition: "all 0.15s", outline: "none" }}
            className="hover:bg-rose-950/20 hover:text-rose-400 hover:border-rose-900/40"
          >
            Clear All
          </button>
        )}
      </div>

    </div>
  );
}
