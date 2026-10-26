// src/modules/FixturePlacementStudio/Toolbar/buttons/CalculateLuxButton.tsx
//
// Runs the illuminance-map calculation. Extracted from the inline button
// that used to live in FixtureToolbar.
//
// Disabled while a calculation is in flight; the button text switches to
// "Calculating…" so the user gets feedback without a separate spinner.

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { runCalculationThunk } from '@/modules/FixturePlacementStudio/store/fixtureThunks';
import { selectIsCalculating } from '@/modules/FixturePlacementStudio/store/fixtureSelectors';

export const CalculateLuxButton: React.FC = () => {
  const dispatch = useAppDispatch();
  const isCalculating = useAppSelector(selectIsCalculating);

  const handleClick = () => {
    if (isCalculating) return;
    dispatch(
      runCalculationThunk({
        kind: 'illuminance-map',
        resolutionMeters: 1.0,
        heightMeters: 0.8,
      }) as any
    );
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isCalculating}
      title="Compute illuminance map from current fixture layout"
      style={{
        ...button,
        background: isCalculating
          ? 'rgba(30, 41, 59, 0.4)'
          : 'rgba(56, 189, 248, 0.12)',
        borderColor: isCalculating ? '#1E293B' : '#38BDF8',
        color: isCalculating ? '#64748B' : '#7DD3FC',
        cursor: isCalculating ? 'wait' : 'pointer',
      }}
    >
      {isCalculating ? '📊 Calculating…' : '📊 Calculate Lux'}
    </button>
  );
};

const button: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 10px',
  borderRadius: 4,
  border: '1px solid #1E293B',
  fontSize: 11,
  fontFamily: 'monospace',
  transition: 'background 0.1s, border-color 0.1s, color 0.1s',
};

export default CalculateLuxButton;