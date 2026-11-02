// src/modules/DaliProgrammingStudio/Dashboard/ProgrammingDashboard.tsx

import React from 'react';
import { ProgrammingOverview } from '@/modules/DaliProgrammingStudio/Dashboard/ProgrammingOverview';
import { DeviceProgrammingStatus } from '@/modules/DaliProgrammingStudio/Dashboard/DeviceProgrammingStatus';
import { GatewayConnectionStatus } from '@/modules/DaliProgrammingStudio/Dashboard/GatewayConnectionStatus';
import { ProgrammingJobsPanel } from '@/modules/DaliProgrammingStudio/Dashboard/ProgrammingJobsPanel';
import { ProgrammingAlerts } from '@/modules/DaliProgrammingStudio/Dashboard/ProgrammingAlerts';
import { ProgrammingActivityTimeline } from '@/modules/DaliProgrammingStudio/Dashboard/ProgrammingActivityTimeline';
import type { HistoryEntry } from '@/modules/DaliProgrammingStudio/Document/ProgrammingHistory';

interface ProgrammingDashboardProps {
  history?: HistoryEntry[];
  onShowErrors?: () => void;
}

export const ProgrammingDashboard: React.FC<ProgrammingDashboardProps> = ({ history = [], onShowErrors }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <ProgrammingOverview />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <DeviceProgrammingStatus />
        <GatewayConnectionStatus />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <ProgrammingJobsPanel />
        <ProgrammingAlerts onShowErrors={onShowErrors} />
      </div>
      <ProgrammingActivityTimeline entries={history} />
    </div>
  );
};

export default ProgrammingDashboard;