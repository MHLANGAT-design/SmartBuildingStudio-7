import React from "react";
import { useAppSelector } from "@/Application/ConfigureStore";
import { selectSelectedNode } from "@/modules/ProjectExplorer/Store/ProjectExplorerSelectors";

export default function DocumentSummary() {
  const selectedNode = useAppSelector(selectSelectedNode);

  if (!selectedNode || selectedNode.type !== "Document") return null;

  const handleLaunchStudioSession = () => {
    console.log(`[DocumentLauncher Core] Routing to engineering workspace container target session: ${selectedNode.id}`);
    // Router push redirects execute cleanly right here matching module owner categories
  };

  return (
    <div className="space-y-6 select-none animate-fadeIn text-slate-200">
      <div className="p-5 bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xl">
        <div>
          <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest bg-amber-950/40 border border-amber-900/30 px-2 py-0.5 rounded">
            Engineering Layout Sheet
          </span>
          <h2 className="text-lg font-bold text-white tracking-wide mt-2">{selectedNode.name}</h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">Classification Framework: {selectedNode.documentType}</p>
        </div>

        <button
          onClick={handleLaunchStudioSession}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all shrink-0"
        >
          🚀 Launch Design Studio
        </button>
      </div>

      {/* Meta Inspection parameters sheet */}
      <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-900 pb-2">
          File Ingestion Metadata Records
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs text-slate-400">
          <div>• File Unique GUID: <span className="text-slate-200 select-all">{selectedNode.id}</span></div>
          <div>• Active Revision Version: <span className="text-slate-200 font-bold">{selectedNode.revision || "V1.0"}</span></div>
          <div>• System Operator Lead: <span className="text-slate-200">{selectedNode.modifiedBy || "Lead Designer"}</span></div>
          <div>• Chrono Stamp: <span className="text-slate-500">{selectedNode.modifiedAt ? new Date(selectedNode.modifiedAt).toLocaleString() : "2026-07-08"}</span></div>
        </div>
      </div>
    </div>
  );
}
