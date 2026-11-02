// src/modules/DaliProgrammingStudio/Network/NetworkHealthPanel.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectApprovedDesign, selectDiagnosticsReport } from '@/modules/DaliProgrammingStudio/store/programmingSelectors';

export const NetworkHealthPanel: React.FC = () => {
  const design = useAppSelector(selectApprovedDesign);
  const diagnostics = useAppSelector(selectDiagnosticsReport);

  const isHealthy = diagnostics?.isHealthy ?? true;
  const criticalCount = diagnostics?.summary.critical ?? 0;
  const errorCount = diagnostics?.summary.errors ?? 0;
  const warningCount = diagnostics?.summary.warnings ?? 0;

  return (
    <div style={cardStyle}>
      <div style={cardTitleStyle}>Network Health</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <StatusRow 
          label="Overall" 
          value={isHealthy ? 'Healthy' : 'Issues Detected'} 
          color={isHealthy ? '#4ADE80' : '#F87171'} 
        />
        <StatusRow label="Critical" value={String(criticalCount)} color={criticalCount > 0 ? '#F87171' : '#94A3B8'} />
        <StatusRow label="Errors" value={String(errorCount)} color={errorCount > 0 ? '#FB923C' : '#94A3B8'} />
        <StatusRow label="Warnings" value={String(warningCount)} color={warningCount > 0 ? '#FBBF24' : '#94A3B8'} />
        <div style={{ height: 1, background: '#1F2937', margin: '4px 0' }} />
        <StatusRow label="Lines" value={String(design?.topology.lines.length ?? 0)} color="#E5E7EB" />
        <StatusRow label="Gateways" value={String(design?.topology.gateways.length ?? 0)} color="#E5E7EB" />
      </div>
    </div>
  );
};

const StatusRow: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
    <span style={{ color: '#94A3B8' }}>{label}</span>
    <span style={{ color, fontWeight: 'bold', fontFamily: 'monospace' }}>{value}</span>
  </div>
);

const cardStyle: React.CSSProperties = {
  background: '#0F1424',
  border: '1px solid #1F2937',
  borderRadius: 6,
  padding: 12,
  marginBottom: 12,
};

const cardTitleStyle: React.CSSProperties = {
  color: '#38BDF8',
  fontSize: 11,
  fontWeight: 'bold',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  marginBottom: 8,
};