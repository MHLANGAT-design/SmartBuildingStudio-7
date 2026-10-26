// src/modules/FixturePlacementStudio/Toolbar/groups/ViewGroup.tsx
//
// Toggle buttons for the canvas layer visibility map. Each toggle
// dispatches setLayerVisible({ layer, visible }) which the canvas
// reads from the slice every render.

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import {
  setLayerVisible,
  type LayerKey,
} from '@/modules/FixturePlacementStudio/store/fixtureSlice';
import { selectLayerVisibility } from '@/modules/FixturePlacementStudio/store/fixtureSelectors';

interface ToggleSpec {
  key: LayerKey;
  label: string;
  icon: string;
  /** Small hint shown in the tooltip. */
  hint: string;
}

const TOGGLES: ToggleSpec[] = [
  { key: 'grid',         label: 'Grid',     icon: '⊞', hint: 'Background grid (visible only when no plan is loaded)' },
  { key: 'rooms',        label: 'Rooms',    icon: '▭', hint: 'Room fills and labels' },
  { key: 'heatmap',      label: 'Heatmap',  icon: '🌡', hint: 'Illuminance heatmap' },
  { key: 'zones',        label: 'Zones',    icon: '◯', hint: 'Zone envelopes' },
  { key: 'fixtures',     label: 'Fixtures', icon: '●', hint: 'Fixture glyphs' },
  { key: 'selection',    label: 'Selection',icon: '◆', hint: 'Drag preview for the selected fixture' },
  { key: 'placement',    label: 'Ghost',    icon: '✛', hint: 'Placement ghost cursor' },
  { key: 'measurements', label: 'Measure',  icon: '📏', hint: 'Measurement overlay (not yet implemented)' },
  { key: 'snap',         label: 'Snap',     icon: '⌖', hint: 'Snap indicator (not yet implemented)' },
];

export const ViewGroup: React.FC = () => {
  const dispatch = useAppDispatch();
  const visibility = useAppSelector(selectLayerVisibility);

  return (
    <div style={group}>
      {TOGGLES.map((t) => {
        const active = visibility[t.key] === true;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() =>
              dispatch(setLayerVisible({ layer: t.key, visible: !active }))
            }
            title={`${t.label} — ${t.hint}`}
            style={{
              ...button,
              background: active
                ? 'rgba(56, 189, 248, 0.18)'
                : 'rgba(30, 41, 59, 0.4)',
              borderColor: active ? '#38BDF8' : '#1E293B',
              color: active ? '#7DD3FC' : '#94A3B8',
            }}
          >
            <span style={{ fontSize: 11 }}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
};

const group: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  flexWrap: 'wrap',
  rowGap: 4,
};

const button: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '3px 8px',
  borderRadius: 4,
  border: '1px solid #1E293B',
  fontSize: 10,
  fontFamily: 'monospace',
  cursor: 'pointer',
  transition: 'background 0.1s, border-color 0.1s, color 0.1s',
};

export default ViewGroup;