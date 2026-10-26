import React from "react";
import { useAppSelector } from "@/Application/ConfigureStore";
import { selectSelectedNode, selectChildNodesMap } from "@/modules/ProjectExplorer/Store/ProjectExplorerSelectors";

export default function FloorSummary() {
  const selectedNode = useAppSelector(selectSelectedNode);
  const childNodesMap = useAppSelector(selectChildNodesMap);

  if (!selectedNode || selectedNode.type !== "Floor") return null;

  const documentNodes = childNodesMap[selectedNode.id] || [];

  return (
    <div className="space-y-6 select-none animate-fadeIn text-slate-200">
      <div className="p-5 bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 rounded-2xl flex justify-between items-center shadow-xl">
        <div>
          <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/40 border border-emerald-900/30 px-2 py-0.5 rounded">
            Floor Height Plane
          </span>
          <h2 className="text-lg font-bold text-white tracking-wide mt-2">{selectedNode.name}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Child Document Sheet Matrix */}
        <div className="md:col-span-2 p-5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Linked Engineering Sub-Schematics
          </h3>
          
          {documentNodes.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4">No drawing charts or audit sheets bound to this elevation tier.</p>
          ) : (
            <div className="divide-y divide-slate-900">
              {documentNodes.map(doc => (
                <div key={doc.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-medium text-slate-200">{doc.name}</span>
                    <span className="block text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-wide">
                      Type: {doc.documentType || "Layout Draft"}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{doc.revision || "v1.0"}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Environmental Area Constraints */}
        <div className="md:col-span-1 p-5 bg-slate-950/40 border border-slate-800 rounded-2xl space-y-3 font-mono text-xs">
          <h3 className="text-xs font-bold font-sans text-white uppercase tracking-wider">
            Z-Axis Parameters
          </h3>
          <div className="space-y-2 pt-1">
            <div className="flex justify-between border-b border-slate-900 pb-1.5 text-slate-400">
              <span>Clearance:</span>
              <span className="text-slate-200 font-bold">3.20 m</span>
            </div>
            <div className="flex justify-between border-b border-slate-900 pb-1.5 text-slate-400">
              <span>Attenuation:</span>
              <span className="text-amber-400">High Loss</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
