import { useState } from "react";

export default function CalendarWidget() {
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "cleared">("all");

  // Transformed static configurations array into an active interactive state bucket
  const [milestones, setMilestones] = useState([
    {
      id: "m-01",
      date: "Jul 10",
      time: "08:30 AM",
      desc: "DALI Commissioning - Site Alpha",
      loc: "Zone B // Sub-level 1",
      category: "Commissioning",
      status: "pending",
      color: "#00D2FF",
      bg: "rgba(0, 210, 255, 0.1)"
    },
    {
      id: "m-02",
      date: "Jul 15",
      time: "02:00 PM",
      desc: "Emergency Lighting Safety Audit",
      loc: "Main Concourse // Floor 3",
      category: "Audit",
      status: "pending",
      color: "#FFB800",
      bg: "rgba(255, 184, 0, 0.1)"
    }
  ]);

  // Toggles action statuses natively when a card row is clicked
  const handleMilestoneToggle = (id: string) => {
    setMilestones(prev => prev.map(m => {
      if (m.id !== id) return m;

      const isPending = m.status === "pending";
      return {
        ...m,
        status: isPending ? "cleared" : "pending",
        // Dynamically morph accent colors when status updates are triggered
        color: isPending ? "#05FFC4" : (m.id === "m-01" ? "#00D2FF" : "#FFB800")
      };
    }));
  };

  const filteredMilestones = milestones.filter(m => activeTab === "all" || m.status === activeTab);
  return (
    <div style={{ background: "rgba(22, 30, 49, 0.4)", border: "1px solid #1E293B", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", boxSizing: "border-box", position: "relative", overflow: "hidden" }}>

      <div>
        {/* COMPONENT COMMAND HEADER BLOCK */}
        <div style={{ marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #1E293B", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <svg style={{ width: "16px", height: "16px", color: "#FFB800" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <div>
              <h3 style={{ fontSize: "10px", fontFamily: "monospace", color: "#64748B", textTransform: "uppercase", margin: 0, letterSpacing: "0.1em" }}>Agenda</h3>
              <h2 style={{ fontSize: "14px", fontWeight: "bold", color: "#FFF", margin: "2px 0 0 0", fontFamily: "sans-serif" }}>Field Milestones</h2>
            </div>
          </div>
          <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#94A3B8", backgroundColor: "#090D16", border: "1px solid #1E293B", padding: "2px 8px", borderRadius: "6px" }}>
            Scheduler Active
          </span>
        </div>

        {/* AGENDA MANAGEMENT FILTER RIBBON */}
        <div style={{ display: "flex", background: "#090D16", padding: "4px", borderRadius: "8px", border: "1px solid #1E293B", marginBottom: "16px", gap: "4px" }}>
          {(["all", "pending", "cleared"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ flex: 1, background: activeTab === tab ? "#1E293B" : "transparent", border: "none", color: activeTab === tab ? "#FFF" : "#64748B", padding: "6px 0", borderRadius: "6px", fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", fontFamily: "monospace", cursor: "pointer", outline: "none" }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* HIGH-FIDELITY TRACKING FEED TIMELINE */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filteredMilestones.map((d) => (
            <div
              key={d.id}
              onClick={() => handleMilestoneToggle(d.id)}
              style={{ padding: "14px", background: "#090D16", border: "1px solid #1E293B", borderLeft: `3px solid ${d.color}`, borderRadius: "0 12px 12px 0", display: "flex", flexDirection: "column", gap: "10px", position: "relative", cursor: "pointer", transition: "border 0.2s, background 0.15s" }}
              className="hover:bg-slate-900/40"
              title={`Click to mark this field action item as ${d.status === "pending" ? "CLEARED" : "PENDING"}`}
            >
              {/* ROW BLOCK: HEADER LABELS */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontFamily: "monospace", fontSize: "9px", fontWeight: "bold", backgroundColor: "#080B14", border: `1px solid ${d.color}`, color: d.color, padding: "2px 6px", borderRadius: "4px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    {d.date}
                  </span>
                  <span style={{ fontSize: "10px", color: "#64748B", fontFamily: "monospace", display: "flex", alignItems: "center", gap: "4px" }}>
                    <svg style={{ width: "12px", height: "12px", color: "#475569" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {d.time}
                  </span>
                </div>

                <span style={{ fontSize: "9px", fontFamily: "monospace", color: d.status === "cleared" ? "#05FFC4" : "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: d.status === "cleared" ? "bold" : "normal" }}>
                  {d.status === "cleared" ? "✓ Cleared" : d.category}
                </span>
              </div>

              {/* ROW BLOCK: MAIN DETAILS MAP */}
              <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: "12px" }}>
                <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
                  <h4 style={{ fontSize: "12px", fontWeight: "600", color: d.status === "cleared" ? "#94A3B8" : "#E2E8F0", textDecoration: d.status === "cleared" ? "line-through" : "none", margin: 0, fontFamily: "sans-serif", letterSpacing: "0.02em" }}>
                    {d.desc}
                  </h4>
                  <p style={{ fontSize: "10px", fontFamily: "monospace", color: "#64748B", margin: 0, display: "flex", alignItems: "center", gap: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <svg style={{ width: "12px", height: "12px", color: "#475569" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    Loc: <span style={{ fontFamily: "sans-serif", color: "#94A3B8" }}>{d.loc}</span>
                  </p>
                </div>

                <svg style={{ width: "12px", height: "12px", color: "#475569", marginTop: "4px", flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>

            </div>
          ))}

          {filteredMilestones.length === 0 && (
            <div style={{ padding: "32px 0", textAlign: "center", border: "1px dashed #1E293B", borderRadius: "12px", background: "rgba(9,13,22,0.2)", fontFamily: "monospace", color: "#64748B" }}>
              No field actions matching parameters.
            </div>
          )}
        </div>
      </div>

      {/* METRIC INDEX BLOCK FOOTNOTE */}
      <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #1E293B", fontSize: "9px", fontFamily: "monospace", color: "#64748B", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>Matrix Clock Synchronous</span>
        <span>UTC +02:00</span>
      </div>

    </div>
  );
}