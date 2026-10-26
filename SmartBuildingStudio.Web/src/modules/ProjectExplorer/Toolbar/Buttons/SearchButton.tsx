import React, { useCallback } from 'react';

export const SearchButton: React.FC = () => {
  const handleAction = useCallback(() => {
    // 🚀 FIXED: Focuses and highlights your sidebar query selector inputs instantly
    const inputElement = document.querySelector('.sbs-explorer-search-wrapper input') as HTMLInputElement;
    if (inputElement) {
      inputElement.focus();
      inputElement.select();
    }
  }, []);

  return (
    <button
      type="button"
      onClick={handleAction}
      className="flex items-center justify-center w-8 h-8 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
      style={{ outline: 'none' }}
      title="Focus System Topology Search Inputs"
    >
      <span>🔍</span>
    </button>
  );
};

export default SearchButton;
