import React, { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { selectExplorerFilters } from '@/modules/ProjectExplorer/Store/ProjectExplorerSelectors';
import { updateExplorerSearch } from '@/modules/ProjectExplorer/Store/ProjectExplorerSlice';

export const ExplorerSearch: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // Safely extract the active query text string, defaulting to empty to protect initial states
  const filters = useAppSelector(selectExplorerFilters);
  const query = filters?.searchQuery ?? '';

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(updateExplorerSearch(event.target.value));
  }, [dispatch]);

  const clearSearch = useCallback(() => {
    dispatch(updateExplorerSearch(''));
  }, [dispatch]);

  return (
    <div className="sbs-explorer-search-wrapper p-3 border-b border-slate-700 bg-slate-850">
      <div className="relative flex items-center bg-slate-900 rounded border border-slate-700 focus-within:border-sky-500 transition-colors">
        <span className="pl-3 text-slate-500 text-sm select-none">🔍</span>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          // 🚀 FIXED: Dynamic placeholder tag matching your macro active control panel description parameters
          placeholder="Search engineering blueprints, clients, or site codes..."
          className="w-full bg-transparent py-1.5 px-2 text-sm text-slate-100 placeholder-slate-500 outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="pr-3 text-slate-400 hover:text-slate-200 text-xs font-bold transition-colors"
            title="Clear Search Query"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default ExplorerSearch;
