import React, { useCallback } from 'react';
import { useAppDispatch } from '@/Application/ConfigureStore';
// 🚀 FIXED: Absolute route linking directly to your correct slice architecture layout folder path
import { collapseAllTreeNodes } from '@/modules/ProjectExplorer/Store/ProjectExplorerSlice';

export const CollapseAllButton: React.FC = () => {
  const dispatch = useAppDispatch();

  const handleAction = useCallback(() => {
    // Reducer loops over active flat nodes safely to collapse branches instantaneously
    dispatch(collapseAllTreeNodes());
  }, [dispatch]);

  return (
    <button
      type="button"
      onClick={handleAction}
      className="flex items-center space-x-1 h-8 px-2 rounded text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
      style={{ outline: 'none' }}
      title="Collapse All Layer Hierarchy Levels"
    >
      <span>↔️</span>
      <span>Collapse All</span>
    </button>
  );
};

export default CollapseAllButton;
