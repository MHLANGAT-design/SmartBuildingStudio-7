import React, { useMemo } from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import ProjectExplorerToolbar from '@/modules/ProjectExplorer/Toolbar/ProjectExplorerToolbar';
import ProjectTree from '@/modules/ProjectExplorer/Sidebar/ProjectTree';
import ProjectSummary from '@/modules/ProjectExplorer/Content/ProjectSummary';
import BuildingSummary from '@/modules/ProjectExplorer/Content/BuildingSummary';
import FloorSummary from '@/modules/ProjectExplorer/Content/FloorSummary';
import DocumentSummary from '@/modules/ProjectExplorer/Content/DocumentSummary';
import RecentActivity from '@/modules/ProjectExplorer/Content/RecentActivity';
import { selectSelectedNodeId, selectAllProjects } from '@/modules/ProjectExplorer/Store/ProjectExplorerSelectors';

export const ProjectExplorerLayout: React.FC = () => {
  const selectedNodeId = useAppSelector(selectSelectedNodeId);
  const projects = useAppSelector(selectAllProjects);

  const activeDetailContext = useMemo(() => {
    if (!selectedNodeId) return { type: 'Dashboard' as const, data: null };
    const projectMatch = projects.find(p => p.id === selectedNodeId);
    if (projectMatch) return { type: 'Project' as const, data: projectMatch };

    for (const p of projects) {
      const buildingMatch = p.buildings?.find(b => b.id === selectedNodeId);
      if (buildingMatch) return { type: 'Building' as const, data: buildingMatch };

      for (const b of p.buildings || []) {
        const floorMatch = b.floors?.find(f => f.id === selectedNodeId);
        if (floorMatch) return { type: 'Floor' as const, data: floorMatch };

        const docMatch = floorMatch?.documents?.find(d => d.id === selectedNodeId);
        if (docMatch) return { type: 'Document' as const, data: docMatch };
      }
    }
    return { type: 'Dashboard' as const, data: null };
  }, [selectedNodeId, projects]);

  const renderContentPanel = () => {
    switch (activeDetailContext.type) {
      case 'Project': return <ProjectSummary project={activeDetailContext.type === 'Project' ? activeDetailContext.data as any : undefined} />;
      case 'Building': return <BuildingSummary building={activeDetailContext.type === 'Building' ? activeDetailContext.data as any : undefined} />;
      case 'Floor': return <FloorSummary floor={activeDetailContext.type === 'Floor' ? activeDetailContext.data as any : undefined} />;
      case 'Document': return <DocumentSummary document={activeDetailContext.type === 'Document' ? activeDetailContext.data as any : undefined} />;
      default: return <RecentActivity />;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", background: "#0B0F19", color: "#E2E8F0", fontFamily: "sans-serif", boxSizing: "border-box" }}>
      
      {/* HEADER TOOLBAR DECK */}
      <header style={{ flexShrink: 0, zIndex: 10, background: "#080B14", borderBottom: "1px solid #1E293B", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
        <ProjectExplorerToolbar />
      </header>

      {/* CORE WORKSPACE ENVIRONMENT ROW */}
      <div style={{ display: "flex", flex: 1, width: "100%", overflow: "hidden" }}>
        
        {/* SIDEBAR NAVIGATION REGION (LOCKED TO 320PX WIDTH BOUNDARY) */}
        <aside style={{ width: "320px", flexShrink: 0, borderRight: "1px solid #1E293B", background: "rgba(15, 23, 42, 0.4)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <ProjectTree />
        </aside>

        {/* WORKSPACE CENTRAL ROW VIEWPORT */}
        <main style={{ flex: 1, minWidth: 0, background: "radial-gradient(circle at top right, rgba(22,30,49,0.3), transparent 70%)", overflowY: "auto", padding: "24px", position: "relative", boxSizing: "border-box" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", height: "100%", display: "flex", flexDirection: "column" }}>
            {renderContentPanel()}
          </div>
        </main>

      </div>
    </div>
  );
};

export default ProjectExplorerLayout;
