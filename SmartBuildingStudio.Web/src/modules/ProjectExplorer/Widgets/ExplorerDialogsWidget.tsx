import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from "@/Application/ConfigureStore";
import { selectExplorerLoading } from "@/modules/ProjectExplorer/Store/ProjectExplorerSelectors";

export default function ExplorerDialogsWidget() {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectExplorerLoading);

  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [projectNumber, setProjectNumber] = useState('');
  const [description, setDescription] = useState('');
  const [customParam, setCustomParam] = useState('');

  useEffect(() => {
    (window as any).openExplorerDialog = (type: string, id: string | null = null) => {
      setActiveDialog(type); setTargetId(id);
    };
    return () => { delete (window as any).openExplorerDialog; };
  }, []);

  if (!activeDialog) return null;
  const closeAndReset = () => {
    setActiveDialog(null); setTargetId(null);
    setName(''); setClientName(''); setProjectNumber(''); setDescription(''); setCustomParam('');
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const thunkModule = await import("@/modules/ProjectExplorer/Store/ProjectExplorerThunks");
      if (!thunkModule.createExplorerProject || !thunkModule.fetchProjectExplorerTree) throw new Error("Missing handles.");
      await dispatch(thunkModule.createExplorerProject({ name, code: projectNumber, client: clientName }) as any);
      await dispatch(thunkModule.fetchProjectExplorerTree() as any);
      closeAndReset();
    } catch (err: any) { alert(`Submission Blocked: ${err.message}`); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(3, 7, 18, 0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "#090D16", border: "1px solid #1E293B", borderRadius: "16px", padding: "24px", width: "480px", maxWidth: "95%", boxSizing: "border-box", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, #00D2FF, #05FFC4)" }} />

        {activeDialog === 'CREATE_PROJECT' && (
          <form onSubmit={handleCreateProject} style={{ display: "flex", flexDirection: "column", gap: "14px", fontFamily: "monospace", fontSize: "12px" }}>
            <h2 style={{ fontSize: "13px", fontWeight: "bold", color: "#FFF", margin: 0, textTransform: "uppercase" }}>Provision Project Core</h2>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Project Name" style={{ padding: "10px", borderRadius: "8px", background: "#040811", border: "1px solid #1E293B", color: "#FFF", outline: "none" }} />
            <input type="text" required value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client Name" style={{ padding: "10px", borderRadius: "8px", background: "#040811", border: "1px solid #1E293B", color: "#FFF", outline: "none" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <input type="text" required value={projectNumber} onChange={(e) => setProjectNumber(e.target.value)} placeholder="Code (e.g. PRJ-002)" style={{ padding: "10px", borderRadius: "8px", background: "#040811", border: "1px solid #1E293B", color: "#FFF", outline: "none", textTransform: "uppercase" }} />
              <input type="number" disabled value={1} style={{ padding: "10px", borderRadius: "8px", background: "#03060C", border: "1px solid #0F172A", color: "#475569", fontWeight: "bold" }} />
            </div>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Scope Description..." style={{ padding: "10px", borderRadius: "8px", background: "#040811", border: "1px solid #1E293B", color: "#FFF", outline: "none", resize: "none" }} />
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="button" onClick={closeAndReset} style={{ width: "50%", padding: "10px", background: "none", border: "1px solid #1E293B", borderRadius: "8px", color: "#64748B" }}>Cancel</button>
              <button type="submit" disabled={loading} style={{ width: "50%", padding: "10px", background: "linear-gradient(90deg, #0066FF, #00D2FF)", border: "none", borderRadius: "8px", color: "#000", fontWeight: "bold" }}>{loading ? 'Processing...' : 'Commit to SQL Server'}</button>
            </div>
          </form>
        )}
        {activeDialog === 'DELETE_PROJECT' && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontFamily: "monospace", fontSize: "12px" }}>
            <h2 style={{ fontSize: "13px", fontWeight: "bold", color: "#F43F5E", margin: 0 }}>Purge Validation Flow</h2>
            <div style={{ padding: "12px", background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.15)", borderRadius: "8px", color: "#FDA4AF" }}>⚠️ Destructive operation. All child folders will be unmounted from disk.</div>
            <input type="text" value={customParam} onChange={(e) => setCustomParam(e.target.value)} placeholder="Type DELETE" style={{ padding: "10px", borderRadius: "8px", background: "#040811", border: "1px solid #1E293B", color: "#FFF", textTransform: "uppercase", outline: "none" }} />
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="button" onClick={closeAndReset} style={{ width: "50%", padding: "10px", background: "none", border: "1px solid #1E293B", borderRadius: "8px", color: "#64748B" }}>Cancel</button>
              <button type="button" disabled={customParam !== 'DELETE'} onClick={async () => {
                // 🚀 FIXED: Robust identifier extraction resolving both direct targets and active panel states
                const activeId = targetId || (window as any).currentSelectedExplorerId;
                if (!activeId) { alert("Please highlight an operational node branch first."); return; }
                
                const thunkModule = await import("@/modules/ProjectExplorer/Store/ProjectExplorerThunks");
                if (thunkModule.deleteExplorerNode && thunkModule.fetchProjectExplorerTree) {
                  await dispatch(thunkModule.deleteExplorerNode(activeId) as any);
                  await dispatch(thunkModule.fetchProjectExplorerTree() as any);
                }
                closeAndReset();
              }} style={{ width: "50%", padding: "10px", background: customParam === 'DELETE' ? "#F43F5E" : "#1E293B", border: "none", borderRadius: "8px", color: customParam === 'DELETE' ? "#000" : "#64748B", fontWeight: "bold" }}>Execute Purge</button>
            </div>
          </div>
        )}

        {activeDialog === 'NEW_BUILDING' && (
          <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              const activeId = targetId || (window as any).currentSelectedExplorerId;
              if (!activeId) throw new Error("No active parent context project selection found.");

              const thunkModule = await import("@/modules/ProjectExplorer/Store/ProjectExplorerThunks");
              const res = await fetch(`/api/v1/project-explorer/projects/${activeId}/buildings`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify({ Name: name, Code: projectNumber, Address: "Default Workspace Area" })
              });
              if (!res.ok) throw new Error("Building registration failed.");
              await dispatch(thunkModule.fetchProjectExplorerTree() as any);
              closeAndReset();
            } catch (err: any) { alert(`Blocked: ${err.message}`); }
          }} style={{ display: "flex", flexDirection: "column", gap: "14px", fontFamily: "monospace", fontSize: "12px" }}>
            <h2 style={{ fontSize: "13px", fontWeight: "bold", color: "#FFF", margin: 0 }}>Inject Building Complex</h2>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Building Name" style={{ padding: "10px", borderRadius: "8px", background: "#040811", border: "1px solid #1E293B", color: "#FFF", outline: "none" }} />
            <input type="text" required value={projectNumber} onChange={(e) => setProjectNumber(e.target.value)} placeholder="Building Code (e.g. BLDG-A)" style={{ padding: "10px", borderRadius: "8px", background: "#040811", border: "1px solid #1E293B", color: "#FFF", textTransform: "uppercase", outline: "none" }} />
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="button" onClick={closeAndReset} style={{ width: "50%", padding: "10px", background: "none", border: "1px solid #1E293B", borderRadius: "8px", color: "#64748B" }}>Cancel</button>
              <button type="submit" style={{ width: "50%", padding: "10px", background: "linear-gradient(90deg, #0066FF, #00D2FF)", border: "none", borderRadius: "8px", color: "#000", fontWeight: "bold" }}>Mount Structure</button>
            </div>
          </form>
        )}
        {activeDialog === 'NEW_FLOOR' && (
          <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              const activeId = targetId || (window as any).currentSelectedExplorerId;
              if (!activeId) throw new Error("No active parent building folder found.");

              const thunkModule = await import("@/modules/ProjectExplorer/Store/ProjectExplorerThunks");
              const res = await fetch(`/api/v1/project-explorer/buildings/${activeId}/floors`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify({ Name: name, LevelNumber: parseInt(projectNumber) || 0, ElevationMeters: parseFloat(customParam) || 0.0, FloorAreaSqMeters: 1000.0 })
              });
              if (!res.ok) throw new Error("Floor registration failed.");
              await dispatch(thunkModule.fetchProjectExplorerTree() as any);
              closeAndReset();
            } catch (err: any) { alert(`Blocked: ${err.message}`); }
          }} style={{ display: "flex", flexDirection: "column", gap: "14px", fontFamily: "monospace", fontSize: "12px" }}>
            <h2 style={{ fontSize: "13px", fontWeight: "bold", color: "#FFF", margin: 0 }}>Provision Elevation Tier</h2>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Floor Name (e.g. Level 1)" style={{ padding: "10px", borderRadius: "8px", background: "#040811", border: "1px solid #1E293B", color: "#FFF", outline: "none" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <input type="number" required value={projectNumber} onChange={(e) => setProjectNumber(e.target.value)} placeholder="Level Index (0, 1, 2)" style={{ padding: "10px", borderRadius: "8px", background: "#040811", border: "1px solid #1E293B", color: "#FFF", outline: "none" }} />
              <input type="text" required value={customParam} onChange={(e) => setCustomParam(e.target.value)} placeholder="Height (m)" style={{ padding: "10px", borderRadius: "8px", background: "#040811", border: "1px solid #1E293B", color: "#FFF", outline: "none" }} />
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="button" onClick={closeAndReset} style={{ width: "50%", padding: "10px", background: "none", border: "1px solid #1E293B", borderRadius: "8px", color: "#64748B" }}>Cancel</button>
              <button type="submit" style={{ width: "50%", padding: "10px", background: "linear-gradient(90deg, #0066FF, #00D2FF)", border: "none", borderRadius: "8px", color: "#000", fontWeight: "bold" }}>Initialize Tier</button>
            </div>
          </form>
        )}

        {activeDialog === 'PROJECT_SETTINGS' && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontFamily: "monospace", fontSize: "12px" }}>
            <h2 style={{ fontSize: "13px", fontWeight: "bold", color: "#FFF", margin: 0 }}>Platform Configuration</h2>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Baseline Power Margin (W)" style={{ padding: "10px", borderRadius: "8px", background: "#040811", border: "1px solid #1E293B", color: "#FFF", outline: "none" }} />
            <select value={customParam} onChange={(e) => setCustomParam(e.target.value)} style={{ padding: "10px", borderRadius: "8px", background: "#040811", border: "1px solid #1E293B", color: "#FFF", outline: "none" }}>
              <option value="CRITICAL">STRICT_ENFORCEMENT (CRITICAL)</option>
              <option value="WARNING">PERMISSIVE_WARN (WARNING)</option>
            </select>
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="button" onClick={closeAndReset} style={{ width: "50%", padding: "10px", background: "none", border: "1px solid #1E293B", borderRadius: "8px", color: "#64748B" }}>Cancel</button>
              <button type="button" onClick={() => closeAndReset()} style={{ width: "50%", padding: "10px", background: "linear-gradient(90deg, #0066FF, #00D2FF)", border: "none", borderRadius: "8px", color: "#000", fontWeight: "bold" }}>Save Configuration</button>
            </div>
          </div>
        )}

        {activeDialog === 'RENAME_PROJECT' && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontFamily: "monospace", fontSize: "12px" }}>
            <h2 style={{ fontSize: "13px", fontWeight: "bold", color: "#FFF", margin: 0, textTransform: "uppercase" }}>Modify Node Identifier</h2>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="New Name Designation" style={{ padding: "10px", borderRadius: "8px", background: "#040811", border: "1px solid #1E293B", color: "#FFF", outline: "none" }} />
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="button" onClick={closeAndReset} style={{ width: "50%", padding: "10px", background: "none", border: "1px solid #1E293B", borderRadius: "8px", color: "#64748B" }}>Cancel</button>
              <button type="button" onClick={async () => {
                // 🚀 FIXED: Securely fall back to currentSelectedExplorerId to trigger state re-fetching on submit
                const activeId = targetId || (window as any).currentSelectedExplorerId;
                if (!activeId || !name) { alert("Designation entry fields cannot be empty."); return; }

                const thunkModule = await import("@/modules/ProjectExplorer/Store/ProjectExplorerThunks");
                if (thunkModule.renameExplorerNode && thunkModule.fetchProjectExplorerTree) {
                  await dispatch(thunkModule.renameExplorerNode({ nodeId: activeId, newName: name }) as any);
                  await dispatch(thunkModule.fetchProjectExplorerTree() as any);
                }
                closeAndReset();
              }} style={{ width: "50%", padding: "10px", background: "linear-gradient(90deg, #0066FF, #00D2FF)", border: "none", borderRadius: "8px", color: "#000", fontWeight: "bold" }}>Update Identifier</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
