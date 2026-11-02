// src/modules/DaliProgrammingStudio/Sidebar/ProgrammingSidebar.tsx

import React, { useState } from 'react';
import { DesignExplorer } from '@/modules/DaliProgrammingStudio/Sidebar/DesignExplorer/DesignExplorer';
import { ProgrammingJobExplorer } from '@/modules/DaliProgrammingStudio/Sidebar/ProgrammingJobs/ProgrammingJobExplorer';
import { DeviceCapabilitiesPanel } from '@/modules/DaliProgrammingStudio/Sidebar/DeviceCapabilities/DeviceCapabilitiesPanel';

type SidebarTab = 'design' | 'jobs' | 'capabilities';

export const ProgrammingSidebar: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SidebarTab>('design');

  return (
    <aside
      style={{
        width: 260,
        background: '#0A0F1E',
        borderRight: '1px solid #1F2937',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #1F2937',
          background: '#0F1424',
        }}
      >
        {(['design', 'jobs', 'capabilities'] as SidebarTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '8px 4px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #38BDF8' : '2px solid transparent',
              color: activeTab === tab ? '#38BDF8' : '#94A3B8',
              fontSize: 10,
              fontWeight: activeTab === tab ? 'bold' : 'normal',
              textTransform: 'uppercase',
              letterSpacing: 0.3,
              cursor: 'pointer',
            }}
          >
            {tab}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
        {activeTab === 'design' && <DesignExplorer />}
        {activeTab === 'jobs' && <ProgrammingJobExplorer />}
        {activeTab === 'capabilities' && <DeviceCapabilitiesPanel />}
      </div>
    </aside>
  );
};