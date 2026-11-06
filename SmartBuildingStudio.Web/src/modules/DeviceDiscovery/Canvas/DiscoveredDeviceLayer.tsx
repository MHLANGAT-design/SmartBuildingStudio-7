// src/modules/DeviceDiscovery/Canvas/DiscoveredDeviceLayer.tsx

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import {
  selectDiscoveredDevices,
  selectSelectedDeviceId,
  selectDesignFixturePlacements,
} from '@/modules/DeviceDiscovery/Store/deviceDiscoverySelectors';
import { selectDevice } from '@/modules/DeviceDiscovery/Store/deviceDiscoverySlice';
import type { DiscoveredDevice } from '@/modules/DeviceDiscovery/Models/DiscoveredDevice';

interface Props {
  worldToScreen: (p: { x: number; y: number }) => { x: number; y: number };
}

const STATUS_COLOR: Record<DiscoveredDevice['status'], string> = {
  MATCHED: '#4ADE80',
  IDENTIFIED: '#FBBF24',
  EXCEPTION: '#F87171',
  UNKNOWN: '#94A3B8',
};

export const DiscoveredDeviceLayer: React.FC<Props> = ({ worldToScreen }) => {
  const dispatch = useAppDispatch();
  const devices = useAppSelector(selectDiscoveredDevices);
  const selectedId = useAppSelector(selectSelectedDeviceId);
  const fixturePlacements = useAppSelector(selectDesignFixturePlacements);

  // ─── DEBUG: what is the layer actually receiving? ───────────────
  const firstWithMatch = devices.find(d => d.matchedFixtureId);
  const firstPlacementKey = Object.keys(fixturePlacements)[0];
  console.log('[DiscoveredDeviceLayer]', {
    deviceCount: devices.length,
    matchedCount: devices.filter(d => d.status === 'MATCHED').length,
    deviceWithMatchId: firstWithMatch?.matchedFixtureId,
    placementKeyCount: Object.keys(fixturePlacements).length,
    firstPlacementKey,
    idsMatch: firstWithMatch?.matchedFixtureId === firstPlacementKey,
  });
  // ────────────────────────────────────────────────────────────────

  return (
    <>
      {devices.map(device => {
        const matched = device.matchedFixtureId
          ? fixturePlacements[device.matchedFixtureId]
          : undefined;

        if (!matched) return null;

        const screen = worldToScreen({ x: matched.x, y: matched.y });
        const color = STATUS_COLOR[device.status];
        const isSelected = device.deviceId === selectedId;

        const label = device.shortAddress != null
          ? `0x${device.shortAddress.toString(16).toUpperCase().padStart(2, '0')}`
          : device.randomAddress.slice(-4);

        return (
          <g
            key={device.deviceId}
            transform={`translate(${screen.x}, ${screen.y})`}
            onClick={(e) => {
              e.stopPropagation();
              dispatch(selectDevice(device.deviceId));
            }}
            style={{ cursor: 'pointer' }}
          >
            {isSelected && (
              <circle r={14} fill="none" stroke="#38BDF8" strokeWidth={2} opacity={0.8} />
            )}
            <circle r={8} fill={color} opacity={0.9} />
            <circle r={8} fill="none" stroke="#0B0F19" strokeWidth={1.5} />
            {!device.isOnline && (
              <line x1={-6} y1={-6} x2={6} y2={6} stroke="#0B0F19" strokeWidth={2} />
            )}
            <text
              y={22}
              textAnchor="middle"
              fontSize={9}
              fill="#E5E7EB"
              fontFamily="monospace"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {label}
            </text>
          </g>
        );
      })}
    </>
  );
};