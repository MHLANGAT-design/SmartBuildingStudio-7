import React from 'react';
import FileGroup from '@/modules/ProjectExplorer/Toolbar/Groups/FileGroup';
import ProjectGroup from '@/modules/ProjectExplorer/Toolbar/Groups/ProjectGroup';
import ViewGroup from '@/modules/ProjectExplorer/Toolbar/Groups/ViewGroup';
import SearchGroup from '@/modules/ProjectExplorer/Toolbar/Groups/SearchGroup';

export const ProjectExplorerToolbar: React.FC = () => {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", height: "44px", padding: "0 16px", background: "#0F1424", borderBottom: "1px solid #1E293B", color: "#E2E8F0", userSelect: "none", boxSizing: "border-box" }}>
      
      {/* LEFT AREA COMMAND CHIPS MATRIX */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        
        <div style={{ display: "flex", alignItems: "center" }}>
          <FileGroup />
        </div>
        
        {/* STRUCTURAL TELEMETRY VERTICAL SPLIT */}
        <div style={{ height: "16px", width: "1px", background: "#1E293B" }} />
        
        <div style={{ display: "flex", alignItems: "center" }}>
          <ProjectGroup />
        </div>
        
        {/* STRUCTURAL TELEMETRY VERTICAL SPLIT */}
        <div style={{ height: "16px", width: "1px", background: "#1E293B" }} />
        
        <div style={{ display: "flex", alignItems: "center" }}>
          <ViewGroup />
        </div>

      </div>

      {/* RIGHT AREA HUD SEARCH CONSOLE ACTION TARGET */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <SearchGroup />
      </div>

    </div>
  );
};

export default ProjectExplorerToolbar;
