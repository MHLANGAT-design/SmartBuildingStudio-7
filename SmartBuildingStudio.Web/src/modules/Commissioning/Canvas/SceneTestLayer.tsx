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

  // FIX: worldToScreen flips Y, so the world-space "top-left" has the larger
  // screen-space y. Compute the rect from the min/max of the two screen-space
  // corners instead of assuming topLeft.y < bottomRight.y. The previous
  // `height={bottomRight.y - topLeft.y}` evaluated to (H/2 - 2500) - (H/2 - 800)
  // = -1700, which React flags as an invalid SVG attribute.
  const x = Math.min(topLeft.x, bottomRight.x);
  const y = Math.min(topLeft.y, bottomRight.y);
  const width = Math.abs(bottomRight.x - topLeft.x);
  const height = Math.abs(bottomRight.y - topLeft.y);

  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="rgba(168, 85, 247, 0.1)"
        stroke="#A855F7"
        strokeWidth={3}
        strokeDasharray="10 5"
        style={{ animation: 'pulse 2s infinite' }}
      />
      <text
        x={x + 10}
        y={y + 20}
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