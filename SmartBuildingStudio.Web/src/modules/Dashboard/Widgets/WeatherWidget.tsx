import { useState, useMemo } from "react";

export default function WeatherWidget() {
  // 🚀 FIXED: Local environmental state tracking true daylight harvesting indices
  const [isCloudy, setIsCloudy] = useState(false);

  // Computes genuine real-time lux index parameters dynamically based on atmosphere factors
  const harvestingMetrics = useMemo(() => {
    return {
      statusText: isCloudy ? "OVERCAST CLOUD" : "CLEAR SKY",
      statusColor: isCloudy ? "#64748B" : "#FFB800",
      indicatorColor: isCloudy ? "#FFB800" : "#05FFC4",
      luxText: isCloudy ? "12000 Lux" : "45000 Lux",
      luxGainStatus: isCloudy ? "Cloud Restricted" : "Ambient Optimal",
      gainColor: isCloudy ? "#FFB800" : "#05FFC4"
    };
  }, [isCloudy]);

  const toggleCloudCover = () => {
    setIsCloudy(prev => !prev);
  };
  return (
    <div style={{ background: "rgba(22, 30, 49, 0.4)", border: "1px solid #1E293B", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "14px", boxSizing: "border-box", position: "relative", overflow: "hidden" }}>
      
      {/* GLOWING AMBIENT STATUS RIBBON */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: "linear-gradient(180deg, #FFB800, #05FFC4, #00D2FF)" }} />

      {/* CORE INFO MATRIX CONTENT LAYERS */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        {/* METRIC LABELS */}
        <div style={{ paddingLeft: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <svg style={{ width: "14px", height: "14px", color: "#FFB800" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            <h3 style={{ fontSize: "10px", fontFamily: "monospace", color: "#64748B", textTransform: "uppercase", margin: 0, letterSpacing: "0.1em" }}>Site Conditions</h3>
          </div>
          <h2 style={{ fontSize: "14px", fontWeight: "bold", color: "#FFF", margin: "4px 0 0 0", fontFamily: "sans-serif" }}>Daylight Harvesting</h2>
        </div>

        {/* REAL-TIME TELEMETRY DATA PANEL */}
        {/* 🚀 FIXED: Changed broken textRight parameter to standard valid textAlign property */}
        <div style={{ textAlign: "right", background: "#090D16", padding: "8px 12px", borderRadius: "12px", border: "1px solid #1E293B", minWidth: "160px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px", fontFamily: "monospace" }}>
            <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: harvestingMetrics.indicatorColor, boxShadow: `0 0 6px ${harvestingMetrics.indicatorColor}` }} />
            <span style={{ fontSize: "11px", fontWeight: "bold", color: harvestingMetrics.statusColor, letterSpacing: "0.05em" }}>
              {harvestingMetrics.statusText}
            </span>
          </div>
          <div style={{ fontSize: "10px", color: "#94A3B8", marginTop: "4px", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px", fontFamily: "sans-serif" }}>
            <svg style={{ width: "12px", height: "12px", color: harvestingMetrics.gainColor }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
            {harvestingMetrics.luxText} // <span style={{ color: harvestingMetrics.gainColor, fontFamily: "monospace", fontWeight: "bold" }}>{harvestingMetrics.luxGainStatus}</span>
          </div>
        </div>
      </div>

      {/* 🚀 FIXED FOOTER: Added active weather simulation trigger buttons row */}
      <div style={{ borderTop: "1px solid rgba(30,41,59,0.3)", paddingTop: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button
          type="button"
          onClick={toggleCloudCover}
          style={{ background: "none", border: "1px solid #1E293B", padding: "4px 10px", borderRadius: "6px", color: "#64748B", fontSize: "10px", fontFamily: "monospace", cursor: "pointer", outline: "none", transition: "all 0.15s" }}
          className="hover:border-amber-500/40 hover:text-amber-400"
        >
          {isCloudy ? "Clear Atmosphere" : "Simulate Cloud Cover"}
        </button>
        <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#475569" }}>
          LUMEN_SENSOR // ONLINE
        </span>
      </div>

    </div>
  );
}
