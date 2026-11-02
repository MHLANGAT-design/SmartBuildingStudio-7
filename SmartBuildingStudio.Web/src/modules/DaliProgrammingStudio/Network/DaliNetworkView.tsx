// src/modules/DaliProgrammingStudio/Network/DaliNetworkView.tsx

import React, { useState } from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectApprovedDesign } from '@/modules/DaliProgrammingStudio/store/programmingSelectors';
import { DeviceNetworkTree } from '@/modules/DaliProgrammingStudio/Network/DeviceNetworkTree';
import { DeviceAddressMap } from '@/modules/DaliProgrammingStudio/Network/DeviceAddressMap';
import { GroupMembershipView } from '@/modules/DaliProgrammingStudio/Network/GroupMembershipView';
import { NetworkHealthPanel } from '@/modules/DaliProgrammingStudio/Network/NetworkHealthPanel';

export const DaliNetworkView: React.FC = () => {
  const design = useAppSelector(selectApprovedDesign);
  const [selectedLineId, setSelectedLineId] = useState<string | undefined>(undefined);
  const [selectedGatewayId, setSelectedGatewayId] = useState<string | undefined>(undefined);

  // Determine which line is active
  const activeLineId = selectedLineId || design?.topology.lines[0]?.lineId;
  const activeLine = design?.topology.lines.find(l => l.lineId === activeLineId);
  const lineDevices = design?.devices.filter(d => d.lineId === activeLineId) || [];
  const occupiedAddresses = lineDevices.map(d => d.hardwareAddress);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 12 }}>
      {/* Left: Tree + Health */}
      <div>
        <DeviceNetworkTree
          selectedLineId={selectedLineId}
          selectedGatewayId={selectedGatewayId}
          onSelectLine={setSelectedLineId}
          onSelectGateway={setSelectedGatewayId}
        />
        <NetworkHealthPanel />
      </div>

      {/* Right: Line Details */}
      <div>
        {activeLine && (
          <div
            style={{
              background: '#0F1424',
              border: '1px solid #1F2937',
              borderRadius: 6,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <div style={{ 
              color: '#38BDF8', 
              fontSize: 11, 
              fontWeight: 'bold', 
              textTransform: 'uppercase', 
              letterSpacing: 0.5, 
              marginBottom: 12 
            }}>
              {activeLine.name} — Address Map
            </div>
            <DeviceAddressMap
              lineId={activeLine.lineId}
              occupiedAddresses={occupiedAddresses}
            />
          </div>
        )}

        <div
          style={{
            background: '#0F1424',
            border: '1px solid #1F2937',
            borderRadius: 6,
            padding: 16,
          }}
        >
          <div style={{ 
            color: '#38BDF8', 
            fontSize: 11, 
            fontWeight: 'bold', 
            textTransform: 'uppercase', 
            letterSpacing: 0.5, 
            marginBottom: 12 
          }}>
            Groups
          </div>
          <GroupMembershipView />
        </div>
      </div>
    </div>
  );
};

export default DaliNetworkView;