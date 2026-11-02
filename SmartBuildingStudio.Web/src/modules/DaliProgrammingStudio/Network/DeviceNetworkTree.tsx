// src/modules/DaliProgrammingStudio/Network/DeviceNetworkTree.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectApprovedDesign } from '@/modules/DaliProgrammingStudio/store/programmingSelectors';
import { GatewayConnectionView } from '@/modules/DaliProgrammingStudio/Network/GatewayConnectionView';
import { DaliLineView } from '@/modules/DaliProgrammingStudio/Network/DaliLineView';

interface Props {
  selectedLineId?: string;
  selectedGatewayId?: string;
  onSelectLine: (lineId: string) => void;
  onSelectGateway: (gatewayId: string) => void;
}

export const DeviceNetworkTree: React.FC<Props> = ({ 
  selectedLineId, 
  selectedGatewayId, 
  onSelectLine, 
  onSelectGateway 
}) => {
  const design = useAppSelector(selectApprovedDesign);

  if (!design) {
    return <div style={{ color: '#64748B', fontSize: 11, padding: 12 }}>No design loaded</div>;
  }

  return (
    <div>
      {design.topology.gateways.map(gateway => {
        const lines = design.topology.lines.filter(l => l.gatewayId === gateway.gatewayId);
        return (
          <div key={gateway.gatewayId} style={{ marginBottom: 12 }}>
            <GatewayConnectionView
              gateway={gateway}
              isSelected={selectedGatewayId === gateway.gatewayId}
              onClick={() => onSelectGateway(gateway.gatewayId)}
            />
            <div style={{ paddingLeft: 16 }}>
              {lines.map(line => (
                <DaliLineView
                  key={line.lineId}
                  line={line}
                  isSelected={selectedLineId === line.lineId}
                  onClick={() => onSelectLine(line.lineId)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};