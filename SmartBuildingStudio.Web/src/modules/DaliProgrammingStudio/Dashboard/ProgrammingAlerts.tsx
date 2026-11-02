// src/modules/DaliProgrammingStudio/Dashboard/ProgrammingAlerts.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { 
  selectError, 
  selectWarnings,
  selectDiagnosticsReport 
} from '@/modules/DaliProgrammingStudio/store/programmingSelectors';

interface Props {
  onShowErrors?: () => void;
}

export const ProgrammingAlerts: React.FC<Props> = ({ onShowErrors }) => {
  const error = useAppSelector(selectError);
  const warnings = useAppSelector(selectWarnings);
  const diagnostics = useAppSelector(selectDiagnosticsReport);

  const hasAlerts = error || warnings.length > 0 || (diagnostics?.summary.critical ?? 0) > 0;

  return (
    <div style={cardStyle}>
      <div style={cardTitleStyle}>Alerts</div>
      {!hasAlerts && (
        <div style={{ color: '#4ADE80', fontSize: 11 }}>✓ No active alerts</div>
      )}
      {error && (
        <div 
          onClick={onShowErrors}
          style={{ 
            ...alertStyle('#F87171'), 
            cursor: onShowErrors ? 'pointer' : 'default',
            transition: 'background 0.15s'
          }}
          onMouseEnter={(e) => { if (onShowErrors) e.currentTarget.style.background = 'rgba(248, 113, 113, 0.25)' }}
          onMouseLeave={(e) => { if (onShowErrors) e.currentTarget.style.background = 'rgba(248, 113, 113, 0.15)' }}
        >
          <strong>Compilation Failed</strong>
          <div style={{ marginTop: 4, fontSize: 10, color: '#FCA5A5', textDecoration: onShowErrors ? 'underline' : 'none' }}>
            Click to view error panel
          </div>
        </div>
      )}
      {warnings.map((w, i) => (
        <div key={i} style={alertStyle('#FBBF24')}>
          ⚠ {w.length > 60 ? `${w.substring(0, 60)}...` : w}
        </div>
      ))}
      {diagnostics && diagnostics.summary.critical > 0 && (
        <div style={alertStyle('#F87171')}>
          <strong>Critical Diagnostics:</strong> {diagnostics.summary.critical} issue(s) detected
        </div>
      )}
    </div>
  );
};

const alertStyle = (color: string): React.CSSProperties => ({
  padding: '6px 10px',
  background: `${color}15`,
  border: `1px solid ${color}40`,
  borderRadius: 4,
  color,
  fontSize: 11,
  marginBottom: 6,
});

const cardStyle: React.CSSProperties = {
  background: '#0F1424',
  border: '1px solid #1F2937',
  borderRadius: 6,
  padding: 16,
  marginBottom: 12,
};

const cardTitleStyle: React.CSSProperties = {
  color: '#38BDF8',
  fontSize: 11,
  fontWeight: 'bold',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  marginBottom: 12,
};