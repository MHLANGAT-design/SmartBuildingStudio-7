// src/modules/GatewayManagement/Components/GatewayRegistration/GatewayConfigurationForm.tsx

import React from 'react';
import type { GatewayConfiguration } from '@/modules/GatewayManagement/Models/GatewayConfiguration';

interface Props {
  config: GatewayConfiguration;
  onChange: (config: GatewayConfiguration) => void;
  errors?: Record<string, string>;
}

export const GatewayConfigurationForm: React.FC<Props> = ({ config, onChange, errors = {} }) => {
  const update = (patch: Partial<GatewayConfiguration>) => onChange({ ...config, ...patch });

  const numField = (
    label: string,
    value: number,
    setter: (v: number) => void,
    errorKey: string,
    min: number,
    max: number
  ) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <label style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase' }}>{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={e => setter(Number(e.target.value) || 0)}
        style={{
          padding: '5px 8px',
          background: '#1E293B',
          color: '#E5E7EB',
          border: `1px solid ${errors[errorKey] ? '#F87171' : '#1F2937'}`,
          borderRadius: 4,
          fontSize: 12,
          outline: 'none',
        }}
      />
      {errors[errorKey] && (
        <span style={{ fontSize: 10, color: '#F87171' }}>{errors[errorKey]}</span>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid #1F2937', paddingTop: 8 }}>
      <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase' }}>Configuration</div>

      {numField('DALI Line Count', config.daliLineCount, v => update({ daliLineCount: v }), 'daliLineCount', 1, 64)}
      {numField('Polling Interval (s)', config.pollingIntervalSeconds, v => update({ pollingIntervalSeconds: v }), 'pollingIntervalSeconds', 1, 3600)}
      {numField('Command Timeout (s)', config.commandTimeoutSeconds, v => update({ commandTimeoutSeconds: v }), 'commandTimeoutSeconds', 1, 600)}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <label style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase' }}>Auth Token (optional)</label>
        <input
          type="password"
          value={config.authToken ?? ''}
          onChange={e => update({ authToken: e.target.value || null })}
          placeholder="Leave blank if not required"
          style={{
            padding: '5px 8px',
            background: '#1E293B',
            color: '#E5E7EB',
            border: '1px solid #1F2937',
            borderRadius: 4,
            fontSize: 12,
            outline: 'none',
          }}
        />
      </div>
    </div>
  );
};