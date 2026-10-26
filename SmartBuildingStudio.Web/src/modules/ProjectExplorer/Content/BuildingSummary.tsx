import React from "react";
import { useAppSelector } from "@/Application/ConfigureStore";
import { selectSelectedNode, selectChildNodesMap } from "@/modules/ProjectExplorer/Store/ProjectExplorerSelectors";

export default function BuildingSummary() {
  const selectedNode = useAppSelector(selectSelectedNode);
  const childNodesMap = useAppSelector(selectChildNodesMap);

  if (!selectedNode || selectedNode.type !== "Building") return null;

  const floorNodes = childNodesMap[selectedNode.id] || [];

  return (
    <div className="space-y-6 select-none animate-fadeIn text-slate-200">
      <div className="p-5 bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 rounded-2xl flex justify-between items-center shadow-xl">
        <div>
          <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-widest bg-purple-950/40 border border-purple-900/30 px-2 py-0.5 rounded">
            Building Infrastructure Structure
          </span>
          <h2 className="text-lg font-bold text-white tracking-wide mt-2">{selectedNode.name}</h2>
        </div>
        <div className="text-right font-mono text-[11px] text-slate-500">
          <div>Revision Block: <span className="text-slate-300 font-bold">{selectedNode.revision || "A"}</span></div>
        </div>
      </div>

      {/* Architectural Floor Levels Datagrid Grid */}
      <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
          Registered Floor Height Planes
        </h3>
        
        {floorNodes.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-4">No floor planes provisioned inside this building container slot.</p>
        ) : (
          <div className="space-y-2">
            {floorNodes.map(floor => (
              <div key={floor.id} className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono">
                <span className="font-sans font-semibold text-slate-200">{floor.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  floor.validationErrorCount > 0 ? "bg-red-950/30 text-red-400 border border-red-900/20" : "bg-emerald-950/30 text-emerald-400 border border-emerald-900/20"
                }`}>
                  {floor.validationErrorCount} Audit Anomalies
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
