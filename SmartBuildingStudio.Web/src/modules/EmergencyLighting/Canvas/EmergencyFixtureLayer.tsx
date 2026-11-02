// src/modules/EmergencyLighting/Canvas/EmergencyFixtureLayer.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectEmergencyLightFixtures } from '@/modules/EmergencyLighting/store/emergencySelectors';

interface EmergencyFixtureLayerProps {
  worldToScreen: (p: { x: number; y: number }) => { x: number; y: number };
}

interface GlyphSpec {
  letter: string;
  color: string;
}

function glyphForMode(mode?: string): GlyphSpec {
  switch (mode) {
    case 'maintained':
      return { letter: 'M', color: '#38BDF8' };
    case 'non-maintained':
      return { letter: 'N', color: '#F59E0B' };
    case 'combined':
      return { letter: 'C', color: '#A855F7' };
    default:
      return { letter: 'E', color: '#94A3B8' };
  }
}

function formatAutonomy(minutes?: number | null): string | null {
  if (minutes == null || !Number.isFinite(minutes)) return null;
  if (minutes >= 60) {
    const h = minutes / 60;
    const hStr = Number.isInteger(h) ? `${h}` : h.toFixed(1);
    return `${hStr}h`;
  }
  return `${minutes}min`;
}

export const EmergencyFixtureLayer: React.FC<EmergencyFixtureLayerProps> = ({
  worldToScreen,
}) => {
  const fixtures = useAppSelector(selectEmergencyLightFixtures);
  const selectedId = useAppSelector(
    (s: any) => s.emergency.ui.selectedEmergencyFixtureId
  );

  if (!Array.isArray(fixtures) || fixtures.length === 0) return null;

  return (
    <g style={{ pointerEvents: 'none' }} className="emergency-fixture-layer">
      {fixtures.map((f) => {
        const classification = (f.emergencyLight as any)?.classification;
        if (classification === 'exit-sign') return null;

        const mode = (f.emergencyLight as any)?.operationMode;
        const autonomyMinutes = (f.emergencyLight as any)?.autonomyMinutes;
        const glyph = glyphForMode(mode);
        const screen = worldToScreen({ x: f.x, y: f.y });
        const isSelected = f.id === selectedId;
        const radius = isSelected ? 11 : 8;
        const autonomyLabel = formatAutonomy(autonomyMinutes);

        // Label sits just below the glyph. Offset scales with radius so the
        // selected state (larger glyph) doesn't collide with its label.
        const labelY = screen.y + radius + 11;

        return (
          <g key={f.id}>
            {isSelected && (
              <circle
                cx={screen.x}
                cy={screen.y}
                r={radius + 6}
                fill="rgba(56, 189, 248, 0.15)"
                stroke="#38BDF8"
                strokeWidth={2}
                strokeDasharray="4 3"
              />
            )}
            <circle
              cx={screen.x}
              cy={screen.y}
              r={radius}
              fill={glyph.color}
              stroke="#0B0F19"
              strokeWidth={2}
            />
            <text
              x={screen.x}
              y={screen.y}
              fill="#0B0F19"
              fontSize={10}
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {glyph.letter}
            </text>

            {/* ── Autonomy label ─────────────────────────────────── */}
            {/* Only rendered when the fixture has an emergencyLight     */}
            {/* payload with autonomyMinutes. Legacy fixtures (no        */}
            {/* payload) skip this entirely — their glyph stays clean.   */}
            {autonomyLabel && (
              <>
                {/* Dark backing plate so the label stays legible over  */}
                {/* walls/rooms/heatmap without needing a solid glyph.  */}
                <rect
                  x={screen.x - 14}
                  y={labelY - 7}
                  width={28}
                  height={11}
                  rx={2}
                  fill="rgba(11, 15, 25, 0.85)"
                  stroke={isSelected ? '#38BDF8' : 'rgba(148, 163, 184, 0.5)'}
                  strokeWidth={0.75}
                />
                <text
                  x={screen.x}
                  y={labelY}
                  fill={isSelected ? '#38BDF8' : '#CBD5E1'}
                  fontSize={8}
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {autonomyLabel}
                </text>
              </>
            )}
          </g>
        );
      })}
    </g>
  );
};

export default EmergencyFixtureLayer;