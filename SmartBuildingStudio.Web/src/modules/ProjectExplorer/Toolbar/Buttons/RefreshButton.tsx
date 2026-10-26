import React, { useCallback, useState } from 'react';
import { useAppDispatch } from '@/Application/ConfigureStore';
import { fetchProjectExplorerTree } from '@/modules/ProjectExplorer/Store/ProjectExplorerThunks';

export const RefreshButton: React.FC = () => {
  const dispatch = useAppDispatch();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleAction = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      // 🚀 LIVE HANDSHAKE: Forces Entity Framework to pull a fresh disk snapshot
      await dispatch(fetchProjectExplorerTree() as any);
    } catch (err) {
      console.error("[Toolbar Sync Error] Tree re-fetch aborted:", err);
    } finally {
      // Small visual delay to match your telemetry data transmission animation
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [dispatch, isRefreshing]);

  return (
    <button
      type="button"
      onClick={handleAction}
      disabled={isRefreshing}
      className={`flex items-center justify-center w-8 h-8 rounded text-slate-300 transition-colors ${
        isRefreshing ? 'bg-slate-800/50 cursor-not-allowed' : 'hover:text-white hover:bg-slate-700'
      }`}
      style={{ outline: 'none' }}
      title="Force Full System Reload and Refresh Telemetry Matrix Data"
    >
      <span className={`inline-block ${isRefreshing ? 'animate-spin' : ''}`}>
        🔄
      </span>
    </button>
  );
};

export default RefreshButton;
