// src/modules/Commissioning/Canvas/SceneTestLayer.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectIsTesting } from '@/modules/Commissioning/store/commissioningSelectors';

interface Props {
  worldToScreen: (p: { x: number; y: number }) => { x: number; y: number };
}

export const SceneTestLayer: React.FC<Props> = ({ worldToScreen }) => {
  const isTesting = useAppSelector(selectIsTesting);
  if (!isTesting) return null;

  // Mock a room bounding box
  const topLeft = worldToScreen({ x: 800, y: 800 });
  const bottomRight = worldToScreen({ x: 3000, y: 2500 });

  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect
        x={topLeft.x}
        y={topLeft.y}
        width={bottomRight.x - topLeft.x}
        height={bottomRight.y - topLeft.y}
        fill="rgba(168, 85, 247, 0.1)"
        stroke="#A855F7"
        strokeWidth={3}
        strokeDasharray="10 5"
        style={{ animation: 'pulse 2s infinite' }}
      />
      <text
        x={topLeft.x + 10}
        y={topLeft.y + 20}
        fill="#A855F7"
        fontSize={12}
        fontFamily="monospace"
        fontWeight="bold"
      >
        SCENE EXECUTING...
      </text>
    </g>
  );
};