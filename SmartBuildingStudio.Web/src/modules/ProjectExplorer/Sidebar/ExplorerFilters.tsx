import React, { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { selectExplorerFilters } from '@/modules/ProjectExplorer/Store/ProjectExplorerSelectors';
import { toggleErrorFilter } from '@/modules/ProjectExplorer/Store/ProjectExplorerSlice';

export const ExplorerFilters: React.FC = () => {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectExplorerFilters);

  // Safely default properties to handle initial null state boundaries smoothly
  const showOnlyErrors = filters?.showOnlyErrors ?? false;
  const activeOwner = filters?.selectedModuleOwner ?? null;

  const handleToggle = useCallback((showErrors: boolean) => {
    if (showOnlyErrors !== showErrors) {
      dispatch(toggleErrorFilter());
    }
  }, [dispatch, showOnlyErrors]);

  // 🚀 FIXED: Dispatches targeted role string tags directly to your active slice trackers
  const handleOwnerToggle = (roleTag: string) => {
    dispatch({
      type: "projectExplorer/updateExplorerSearch",
      payload: activeOwner === roleTag ? null : roleTag
    });
    dispatch({
      type: "projectExplorer/setModuleOwnerFilter",
      payload: activeOwner === roleTag ? null : roleTag
    });
  };

  return (
    <div className="sbs-explorer-filters-panel px-3 py-2 border-b border-slate-700 bg-slate-850 flex flex-col gap-2 select-none">
      
      {/* 🚀 FIRST ROW: STANDARD BOOLEAN STATE MATRIX SEGMENTS */}
      <div className="flex items-center justify-between gap-1 w-full">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Filter Status:</span>
        <div className="flex bg-slate-900 rounded p-0.5 border border-slate-700">
          <button
            type="button"
            onClick={() => handleToggle(false)}
            className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
              !showOnlyErrors 
                ? 'bg-sky-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => handleToggle(true)}
            className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
              showOnlyErrors 
                ? 'bg-sky-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Errors
          </button>
        </div>
      </div>

      {/* 🚀 SECOND ROW: ADDED ENGINEERING ROLE SCOPE COMMAND CHIPS */}
      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-800/60 w-full">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Domain:</span>
        <div className="flex gap-1.5">
          {/* ELECTRICAL ENGINEER FULL WORKSPACE TOGGLE */}
          <button
            type="button"
            onClick={() => handleOwnerToggle("ELECTRICAL")}
            className={`px-2 py-0.5 text-xs font-medium rounded border transition-all ${
              activeOwner === "ELECTRICAL"
                ? 'bg-amber-600 border-amber-500 text-white shadow-sm font-bold'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Electrical Engineer
          </button>

          {/* EE SHORTCUT TOKEN SCOPE BUTTON */}
          <button
            type="button"
            onClick={() => handleOwnerToggle("EE")}
            className={`px-2 py-0.5 text-xs font-medium rounded border transition-all ${
              activeOwner === "EE"
                ? 'bg-cyan-600 border-cyan-500 text-white shadow-sm font-bold'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Isolate workspace topology views to EE hardware matrices"
          >
            ⚡ EE
          </button>
        </div>
      </div>

    </div>
  );
};

export default ExplorerFilters;
