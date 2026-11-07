// src/modules/Commissioning/Toolbar/buttons/DetectFaultsButton.tsx

import React, { useState, useEffect } from 'react';
import { useFaultDetection } from '@/modules/Commissioning/hooks/useFaultDetection';

interface Props {
  onOpenPanel?: () => void;
}

type Feedback = { kind: 'none' } | { kind: 'clean' } | { kind: 'faults'; count: number } | { kind: 'error'; message: string };

export const DetectFaultsButton: React.FC<Props> = ({ onOpenPanel }) => {
  const { faults, isDetecting, detectFaults } = useFaultDetection();
  const [feedback, setFeedback] = useState<Feedback>({ kind: 'none' });

  // Clear feedback after a few seconds so the button settles back to its
  // neutral state.
  useEffect(() => {
    if (feedback.kind === 'none') return;
    const timeout = window.setTimeout(() => setFeedback({ kind: 'none' }), 3500);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const handleClick = async () => {
    try {
      const previousCount = faults.length;
      const updated = await detectFaults();
      const newCount = updated?.activeFaults?.length ?? 0;
      const newlyDetected = newCount - previousCount;

      if (newCount === 0) {
        setFeedback({ kind: 'clean' });
      } else if (newlyDetected > 0) {
        setFeedback({ kind: 'faults', count: newlyDetected });
      } else {
        // No new faults, but existing ones remain — still open the panel
        // so the user sees what's there.
        setFeedback({ kind: 'faults', count: newCount });
      }

      // Open the faults panel so the user can act on what was found.
      onOpenPanel?.();
    } catch (e: any) {
      setFeedback({ kind: 'error', message: e?.message ?? 'Detection failed' });
      console.error('[DetectFaultsButton] detection failed:', e);
    }
  };

  // Compose label + colour from state + feedback.
  let label: string;
  let background: string;
  let color: string;
  let border: string;

  if (isDetecting) {
    label = 'Detecting…';
    background = '#1E293B';
    color = '#94A3B8';
    border = '#334155';
  } else if (feedback.kind === 'clean') {
    label = 'No Faults Detected';
    background = '#052E16';
    color = '#4ADE80';
    border = '#166534';
  } else if (feedback.kind === 'faults') {
    label = `${feedback.count} Fault${feedback.count === 1 ? '' : 's'} Detected`;
    background = '#3F1D1D';
    color = '#F87171';
    border = '#F87171';
  } else if (feedback.kind === 'error') {
    label = 'Detection Failed';
    background = '#3F1D1D';
    color = '#FCA5A5';
    border = '#991B1B';
  } else if (faults.length > 0) {
    label = `View Faults (${faults.length})`;
    background = '#3F1D1D';
    color = '#F87171';
    border = '#F87171';
  } else {
    label = 'Detect Faults';
    background = '#1E293B';
    color = '#E5E7EB';
    border = '#334155';
  }

  return (
    <button
      onClick={handleClick}
      disabled={isDetecting}
      title={feedback.kind === 'error' ? feedback.message : undefined}
      style={{
        padding: '4px 10px',
        background,
        color,
        border: `1px solid ${border}`,
        borderRadius: 3,
        fontSize: 10,
        cursor: isDetecting ? 'wait' : 'pointer',
        opacity: isDetecting ? 0.7 : 1,
        transition: 'background 0.2s, color 0.2s, border-color 0.2s',
      }}
    >
      {label}
    </button>
  );
};