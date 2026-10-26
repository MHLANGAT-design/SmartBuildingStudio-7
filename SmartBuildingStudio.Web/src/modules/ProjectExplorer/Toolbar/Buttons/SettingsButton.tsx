import React, { useCallback } from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectSelectedNodeId } from '@/modules/ProjectExplorer/Store/ProjectExplorerSelectors';

export const SettingsButton: React.FC = () => {
  const selectedId = useAppSelector(selectSelectedNodeId);

  const handleAction = useCallback(() => {
    // 🚀 FIXED: Direct global modal hook to launch power buffers and rule strictness profiles
    if (typeof (window as any).openExplorerDialog === 'function') {
      (window as any).openExplorerDialog('PROJECT_SETTINGS', selectedId);
    } else {
      console.warn("[SBS Linkage] Global dialogue manager interface is currently unmounted.");
    }
  }, [selectedId]);

  return (
    <button
      type="button"
      onClick={handleAction}
      disabled={!selectedId}
      className={`flex items-center justify-center w-8 h-8 rounded transition-colors ${
        selectedId ? 'text-slate-300 hover:text-white hover:bg-slate-700' : 'text-slate-600 cursor-not-allowed'
      }`}
      style={{ outline: 'none' }}
      title="Configure System Properties Panel Parameters"
    >
      <span>⚙️</span>
    </button>
  );
};

export default SettingsButton;
