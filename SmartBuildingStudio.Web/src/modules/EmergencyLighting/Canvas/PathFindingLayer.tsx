// src/modules/EmergencyLighting/Canvas/PathFindingLayer.tsx
//
// Placeholder for future pathfinding visualization. When the emergency
// simulation thunk is extended to compute EvacuationPath entities (from
// each emergency fixture to the nearest exit), it will populate
// `state.emergency.paths`, and this layer will draw them as dashed
// green polylines with waypoint dots.
//
// For now, no pathfinding data is produced, so this layer returns null.
// It is wired into EmergencyCanvas so that when the store gains
// `state.emergency.paths`, nothing else needs to change here.

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';

interface PathFindingLayerProps {
  worldToScreen: (p: { x: number; y: number }) => { x: number; y: number };
}

export const PathFindingLayer: React.FC<PathFindingLayerProps> = ({
  worldToScreen,
}) => {
  const paths = useAppSelector((s: any) => s.emergency.paths || []);
  const visible = useAppSelector(
    (s: any) => s.emergency.layerVisibility?.pathFinding !== false
  );

  if (!visible) return null;
  if (!Array.isArray(paths) || paths.length === 0) return null;

  return (
    <g style={{ pointerEvents: 'none' }} className="path-finding-layer">
      {paths.map((path: any) => {
        const pts: Array<{ x: number; y: number }> = path.points || [];
        if (pts.length < 2) return null;
        const screenPts = pts.map(worldToScreen);
        const polyline = screenPts
          .map((p: { x: number; y: number }) => `${p.x},${p.y}`)
          .join(' ');
        const isViable = path.isViable !== false;
        const color = isViable ? '#10B981' : '#EF4444';

        return (
          <g key={path.id}>
            <polyline
              points={polyline}
              fill="none"
              stroke={color}
              strokeWidth={3}
              strokeDasharray="8 4"
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity={0.8}
            />
            {screenPts.map((p: { x: number; y: number }, i: number) => (
              <circle
                key={`${path.id}-wp-${i}`}
                cx={p.x}
                cy={p.y}
                r={i === 0 ? 5 : 3}
                fill={color}
                stroke="#0B0F19"
                strokeWidth={1.5}
              />
            ))}
          </g>
        );
      })}
    </g>
  );
};

export default PathFindingLayer;