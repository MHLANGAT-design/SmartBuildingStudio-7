// src/modules/Commissioning/Sidebar/CommissioningSidebar.tsx

import React from 'react';
import { DeviceExplorer } from '@/modules/Commissioning/Sidebar/DeviceExplorer';
import { NetworkStatusPanel } from '@/modules/Commissioning/Sidebar/NetworkStatusPanel';
import { TestResultsPanel } from '@/modules/Commissioning/Sidebar/TestResultsPanel';
import { FaultsPanel } from '@/modules/Commissioning/Sidebar/FaultsPanel';
import { ProgressTrackerPanel } from '@/modules/Commissioning/Sidebar/ProgressTrackerPanel';
import { LayersPanel } from '@/modules/Commissioning/Sidebar/LayersPanel';

export const CommissioningSidebar: React.FC = () => {
  return (
    <aside
      style={{
        width: 280,
        background: '#0A0F1E',
        borderRight: '1px solid #1F2937',
        display: 'flex',
        flexDirection: 'column',
        // Calculate the height to leave 64px at the bottom for the zoom toolbar
        height: 'calc(100% - 64px)',
        padding: 12,
        boxSizing: 'border-box',
      }}
    >
      {/* 
        Scrollable middle section. 
        This takes up all available space above the layers panel.
      */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingRight: 4 }}>
        <ProgressTrackerPanel />
        <div style={{ height: 1, background: '#1F2937', margin: '16px 0' }} />
        <DeviceExplorer />
        <NetworkStatusPanel />
        <TestResultsPanel />
        <FaultsPanel />
      </div>

      {/* 
        Layers panel pinned at the bottom.
        flexShrink: 0 ensures it never gets squashed.
      */}
      <div style={{ flexShrink: 0, marginTop: 16 }}>
        <div style={{ height: 1, background: '#1F2937', margin: '0 0 16px 0' }} />
        <LayersPanel />
      </div>
    </aside>
  );
};