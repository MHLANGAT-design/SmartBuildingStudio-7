// src/modules/DaliProgrammingStudio/Inspector/ProgrammingInspector.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectCurrentDocument } from '@/modules/DaliProgrammingStudio/store/programmingSelectors';
import { DeviceInspector } from '@/modules/DaliProgrammingStudio/Inspector/DeviceInspector';
import { AddressInspector } from '@/modules/DaliProgrammingStudio/Inspector/AddressInspector';
import { GroupInspector } from '@/modules/DaliProgrammingStudio/Inspector/GroupInspector';
import { SceneInspector } from '@/modules/DaliProgrammingStudio/Inspector/SceneInspector';
import { GatewayInspector } from '@/modules/DaliProgrammingStudio/Inspector/GatewayInspector';
import { CommandInspector } from '@/modules/DaliProgrammingStudio/Inspector/CommandInspector';
import { DeploymentInspector } from '@/modules/DaliProgrammingStudio/Inspector/DeploymentInspector';
import { VerificationInspector } from '@/modules/DaliProgrammingStudio/Inspector/VerificationInspector';

export type InspectorSelection = 
  | { kind: 'device'; deviceId: string }
  | { kind: 'address'; lineId: string; address: number }
  | { kind: 'group'; groupId: number }
  | { kind: 'scene'; sceneId: number }
  | { kind: 'gateway'; gatewayId: string }
  | { kind: 'command'; commandId: string }
  | { kind: 'deployment'; deploymentId: string }
  | { kind: 'verification'; deviceId: string }
  | null;

interface Props {
  selection: InspectorSelection;
}

export const ProgrammingInspector: React.FC<Props> = ({ selection }) => {
  const doc = useAppSelector(selectCurrentDocument);

  if (!selection) {
    return (
      <aside style={asideStyle}>
        <div style={{ color: '#64748B', fontSize: 11, textAlign: 'center', padding: 16 }}>
          Select an item to inspect
        </div>
      </aside>
    );
  }

  return (
    <aside style={asideStyle}>
      {selection.kind === 'device' && <DeviceInspector deviceId={selection.deviceId} />}
      {selection.kind === 'address' && <AddressInspector lineId={selection.lineId} address={selection.address} />}
      {selection.kind === 'group' && <GroupInspector groupId={selection.groupId} />}
      {selection.kind === 'scene' && <SceneInspector sceneId={selection.sceneId} />}
      {selection.kind === 'gateway' && <GatewayInspector gatewayId={selection.gatewayId} />}
      {selection.kind === 'command' && <CommandInspector commandId={selection.commandId} />}
      {selection.kind === 'deployment' && <DeploymentInspector deploymentId={selection.deploymentId} />}
      {selection.kind === 'verification' && <VerificationInspector deviceId={selection.deviceId} />}
    </aside>
  );
};

const asideStyle: React.CSSProperties = {
  width: 300,
  background: '#0A0F1E',
  borderLeft: '1px solid #1F2937',
  overflow: 'auto',
  padding: 12,
  height: '100%',
};

export default ProgrammingInspector;