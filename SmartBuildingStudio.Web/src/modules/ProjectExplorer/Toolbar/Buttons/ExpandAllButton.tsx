import React, { useCallback } from 'react';
import { useAppDispatch } from '@/Application/ConfigureStore';
// 🚀 FIXED: Pointed explicitly to your correct slice architecture layout folder path
import { expandAllTreeNodes } from '@/modules/ProjectExplorer/Store/ProjectExplorerSlice';

export const ExpandAllButton: React.FC = () => {
  const dispatch = useAppDispatch();

  const handleAction = useCallback(() => {
    // Reducer loops over active nodes safely to change expansion booleans instantaneously
    dispatch(expandAllTreeNodes());
  }, [dispatch]);

  return (
    <button
      type="button"
      onClick={handleAction}
      className="flex items-center space-x-1 h-8 px-2 rounded text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
      style={{ outline: 'none' }}
      title="Expand All Hierarchy Node Branches"
    >
      <span>↕️</span>
      <span>Expand All</span>
    </button>
  );
};

export default ExpandAllButton;
