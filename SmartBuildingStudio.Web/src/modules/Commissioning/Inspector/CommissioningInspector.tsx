// src/modules/Commissioning/Inspector/CommissioningInspector.tsx

import React from 'react';
import { DeviceInspector } from '@/modules/Commissioning/Inspector/DeviceInspector';
import { NetworkInspector } from '@/modules/Commissioning/Inspector/NetworkInspector';
import { FaultInspector } from '@/modules/Commissioning/Inspector/FaultInspector';
import { SceneInspector } from '@/modules/Commissioning/Inspector/SceneInspector';
import { TestResultInspector } from '@/modules/Commissioning/Inspector/TestResultInspector';

export type InspectorSelection =
  | { kind: 'device'; id: string }
  | { kind: 'network'; id: string }
  | { kind: 'fault'; data: any }
  | { kind: 'sceneTest'; data: any }
  | { kind: 'testResult'; data: any }
  | null;

interface Props {
  selection: InspectorSelection;
}

export const CommissioningInspector: React.FC<Props> = ({ selection }) => {
  return (
    <aside
      style={{
        width: 300,
        background: '#0A0F1E',
        borderLeft: '1px solid #1F2937',
        overflow: 'auto',
        padding: 12,
        height: '100%',
      }}
    >
      {!selection && (
        <div style={{ color: '#64748B', fontSize: 11, textAlign: 'center', padding: 16 }}>
          Select an item to inspect
        </div>
      )}

      {selection?.kind === 'device' && <DeviceInspector deviceId={selection.id} />}
      {selection?.kind === 'network' && <NetworkInspector lineId={selection.id} />}
      {selection?.kind === 'fault' && <FaultInspector fault={selection.data} />}
      {selection?.kind === 'sceneTest' && <SceneInspector sceneTest={selection.data} />}
      {selection?.kind === 'testResult' && <TestResultInspector result={selection.data} />}
    </aside>
  );
};