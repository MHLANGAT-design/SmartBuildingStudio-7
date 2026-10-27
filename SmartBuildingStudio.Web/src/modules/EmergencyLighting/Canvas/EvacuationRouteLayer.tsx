// src/modules/EmergencyLighting/Canvas/EvacuationRouteLayer.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';

interface EvacuationRouteLayerProps {
  worldToScreen: (p: { x: number; y: number }) => { x: number; y: number };
}

export const EvacuationRouteLayer: React.FC<EvacuationRouteLayerProps> = ({ worldToScreen }) => {
  const routes = useAppSelector((s: any) => s.emergency.routes || []);
  const layerVisible = useAppSelector((s: any) => s.emergency.layerVisibility?.exitRoutes);

  if (!layerVisible) return null;

  return (
    <g className="evacuation-route-layer">
      {routes.map((route: any) => {
        const pts = Array.isArray(route.points) && route.points.length >= 2
          ? route.points
          : [route.startNode, route.endNode];

        const screenPts = pts.map(worldToScreen);
        const polylinePoints = screenPts
          .map((p: { x: number; y: number }) => `${p.x},${p.y}`)
          .join(' ');

        const xs = screenPts.map((p: { x: number }) => p.x);
        const ys = screenPts.map((p: { y: number }) => p.y);
        const midX = (Math.min(...xs) + Math.max(...xs)) / 2;
        const midY = (Math.min(...ys) + Math.max(...ys)) / 2;

        const color = route.isCompliant ? '#10B981' : '#EF4444';

        return (
          <g key={route.id}>
            <polyline
              points={polylinePoints}
              fill="none"
              stroke={color}
              strokeWidth={4}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <circle cx={screenPts[0].x} cy={screenPts[0].y} r={6} fill={color} />
            <circle
              cx={screenPts[screenPts.length - 1].x}
              cy={screenPts[screenPts.length - 1].y}
              r={6}
              fill={color}
            />

            <rect
              x={midX - 24}
              y={midY - 11}
              width={48}
              height={22}
              fill="rgba(0,0,0,0.7)"
              rx={4}
            />
            <text
              x={midX}
              y={midY}
              fill={color}
              fontSize={12}
              fontFamily="monospace"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {route.lengthMeters.toFixed(1)}m
            </text>
          </g>
        );
      })}
    </g>
  );
};

export default EvacuationRouteLayer;