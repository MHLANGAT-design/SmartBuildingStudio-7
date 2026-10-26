import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectSelectedNodeId, selectExplorerStatistics } from '@/modules/ProjectExplorer/Store/ProjectExplorerSelectors';

export const ExplorerStatistics: React.FC = () => {
  const selectedNodeId = useAppSelector(selectSelectedNodeId);
  const statisticsRecord = useAppSelector(selectExplorerStatistics);

  // 🚀 FIXED: Added safety short-circuit checking to protect from null dictionary pointers completely
  const activeStats = (selectedNodeId && statisticsRecord) ? statisticsRecord[selectedNodeId] : null;

  if (!activeStats) {
    return (
      <div className="sbs-explorer-stats-pane p-4 text-center border-t border-slate-700 bg-slate-850 select-none text-xs text-slate-500">
        Select a node element to evaluate telemetry diagnostics.
      </div>
    );
  }

  return (
    <div className="sbs-explorer-stats-pane p-3 border-t border-slate-700 bg-slate-850 text-xs font-mono">
      <h4 className="text-slate-400 uppercase tracking-wider font-sans font-bold mb-2 select-none text-[10px]">
        Live Node Topology Telemetry
      </h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-slate-300">
        <div className="flex justify-between border-b border-slate-800 pb-0.5">
          <span className="text-slate-500">Buildings:</span>
          <span className="font-bold text-sky-400">{activeStats.buildingCount ?? activeStats.BuildingCount ?? 0}</span>
        </div>
        <div className="flex justify-between border-b border-slate-800 pb-0.5">
          <span className="text-slate-500">Floors:</span>
          <span className="font-bold text-sky-400">{activeStats.floorCount ?? activeStats.FloorCount ?? 0}</span>
        </div>
        <div className="flex justify-between border-b border-slate-800 pb-0.5">
          <span className="text-slate-500">Total Drawings:</span>
          <span className="font-bold text-emerald-400">{activeStats.totalDrawingsCount ?? activeStats.TotalDrawingsCount ?? 0}</span>
        </div>
        <div className="flex justify-between border-b border-slate-800 pb-0.5">
          <span className="text-slate-500">DALI Nets:</span>
          <span className="font-bold text-purple-400">{activeStats.daliNetworksCount ?? activeStats.DaliNetworksCount ?? 0}</span>
        </div>
        <div className="col-span-2 flex justify-between pt-0.5">
          <span className="text-slate-500 font-sans">Validation Exceptions:</span>
          <span className={`font-bold px-1 rounded ${(activeStats.validationErrorsCount ?? activeStats.ValidationErrorsCount ?? 0) > 0 ? 'bg-red-950 text-red-400 border border-red-800' : 'text-slate-400'}`}>
            {(activeStats.validationErrorsCount ?? activeStats.ValidationErrorsCount ?? 0)} Errors
          </span>
        </div>
      </div>
    </div>
  );
};

export default ExplorerStatistics;
