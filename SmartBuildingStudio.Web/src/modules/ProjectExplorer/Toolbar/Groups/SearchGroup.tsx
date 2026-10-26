import React from 'react';
import SearchButton from '@/modules/ProjectExplorer/Toolbar/Buttons/SearchButton';

export const SearchGroup: React.FC = () => {
  return (
    <div className="sbs-toolbar-group-search flex items-center">
      <SearchButton />
    </div>
  );
};

export default SearchGroup;
