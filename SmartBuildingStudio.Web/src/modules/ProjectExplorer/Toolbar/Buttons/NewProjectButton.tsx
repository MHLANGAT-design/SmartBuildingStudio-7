import React, { useCallback } from 'react';

export const NewProjectButton: React.FC = () => {
  const handleAction = useCallback(() => {
    // 🚀 FIXED: Invokes your aggregate overlay manager context instead of local slice flags
    if (typeof (window as any).openExplorerDialog === 'function') {
      (window as any).openExplorerDialog('CREATE_PROJECT');
    } else {
      console.warn("[SBS Linkage] Control deck provisioner interface loading...");
    }
  }, []);

  return (
    <button
      type="button"
      onClick={handleAction}
      className="flex items-center space-x-1.5 h-8 px-2.5 rounded text-xs font-medium text-slate-200 hover:text-white bg-sky-700 hover:bg-sky-600 transition-colors shadow-sm"
      title="Create New Engineering Project Profile"
      style={{ outline: 'none' }}
    >
      <span className="text-sm font-bold leading-none">+</span>
      <span>New Project</span>
    </button>
  );
};

export default NewProjectButton;