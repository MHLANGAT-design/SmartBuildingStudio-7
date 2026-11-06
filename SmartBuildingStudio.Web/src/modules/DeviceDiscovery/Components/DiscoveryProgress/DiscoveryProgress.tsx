// src/modules/DeviceDiscovery/Components/DiscoveryProgress/DiscoveryProgress.tsx

import React from 'react';
import { DiscoveryProgressBar } from '@/modules/DeviceDiscovery/Components/DiscoveryProgress/DiscoveryProgressBar';
import {
  DiscoveryStatusIndicator,
  type DiscoveryPhase,
} from '@/modules/DeviceDiscovery/Components/DiscoveryProgress/DiscoveryStatusIndicator';

interface Props {
  phase: DiscoveryPhase;
  percent: number;
  message?: string;
  /** Hide the whole panel when idle and no message is present. */
  hideWhenIdle?: boolean;
}

export const DiscoveryProgress: React.FC<Props> = ({
  phase,
  percent,
  message,
  hideWhenIdle = true,
}) => {
  if (hideWhenIdle && phase === 'IDLE' && !message) {
    return null;
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      padding: '8px 16px',
      background: '#0F1424',
      borderBottom: '1px solid #1F2937',
    }}>
      <DiscoveryStatusIndicator phase={phase} message={message} />
      <DiscoveryProgressBar percent={percent} label="Discovery progress" />
    </div>
  );
};