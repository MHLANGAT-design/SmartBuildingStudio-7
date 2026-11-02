// src/modules/DaliProgrammingStudio/Network/DaliLineView.tsx

import React from 'react';
import type { DaliLine } from '@/modules/DaliProgrammingStudio/types/dali.types';
import { DALI_HARD_LIMITS } from '@/modules/DaliProgrammingStudio/constants/daliConstants';

interface Props {
  line: DaliLine;
  isSelected?: boolean;
  onClick?: () => void;
}

export const DaliLineView: React.FC<Props> = ({ line, isSelected, onClick }) => {
  const fillPct = (line.deviceCount / line.maxDevices) * 100;
  const isNearFull = fillPct > 80;
  const isFull = fillPct >= 100;

  return (
    <div
      onClick={onClick}
      style={{
        padding: 10,
        background: isSelected ? '#0F2B4C' : '#0A0F1E',
        border: `1px solid ${isSelected ? '#38BDF8' : '#1F2937'}`,
        borderRadius: 4,
        cursor: 'pointer',
        marginBottom: 6,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: '#E5E7EB' }}>{line.name}</span>
        <span style={{ fontSize: 10, color: isFull ? '#F87171' : isNearFull ? '#FBBF24' : '#64748B', fontFamily: 'monospace' }}>
          {line.deviceCount} / {DALI_HARD_LIMITS.MAX_DEVICES_PER_LINE}
        </span>
      </div>
      <div style={{ height: 3, background: '#1F2937', borderRadius: 2, overflow: 'hidden' }}>
        <div
          style={{
            width: `${Math.min(100, fillPct)}%`,
            height: '100%',
            background: isFull ? '#F87171' : isNearFull ? '#FBBF24' : '#4ADE80',
            transition: 'width 0.3s',
          }}
        />
      </div>
    </div>
  );
};