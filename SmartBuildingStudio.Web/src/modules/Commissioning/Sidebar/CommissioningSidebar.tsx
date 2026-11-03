// src/modules/Commissioning/Sidebar/CommissioningSidebar.tsx

import React from 'react';
import { DeviceExplorer } from '@/modules/Commissioning/Sidebar/DeviceExplorer';
import { NetworkStatusPanel } from '@/modules/Commissioning/Sidebar/NetworkStatusPanel';
import { TestResultsPanel } from '@/modules/Commissioning/Sidebar/TestResultsPanel';
import { FaultsPanel } from '@/modules/Commissioning/Sidebar/FaultsPanel';
import { ProgressTrackerPanel } from '@/modules/Commissioning/Sidebar/ProgressTrackerPanel';

export const CommissioningSidebar: React.FC = () => {
  return (
    <aside
      style={{
        width: 280,
        background: '#0A0F1E',
        borderRight: '1px solid #1F2937',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
        padding: 12,
      }}
    >
      <ProgressTrackerPanel />
      <div style={{ height: 1, background: '#1F2937', margin: '16px 0' }} />
      <DeviceExplorer />
      <NetworkStatusPanel />
      <TestResultsPanel />
      <FaultsPanel />
    </aside>
  );
};