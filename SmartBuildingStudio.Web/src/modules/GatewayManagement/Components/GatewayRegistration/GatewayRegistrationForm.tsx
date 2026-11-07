// src/modules/GatewayManagement/Components/GatewayRegistration/GatewayRegistrationForm.tsx

import React, { useState } from 'react';
import { useGateways } from '@/modules/GatewayManagement/Hooks/useGateways';
import type { TransportProtocol, DaliProtocol } from '@/modules/GatewayManagement/Models/Gateway';
import { GatewayConfigurationForm } from '@/modules/GatewayManagement/Components/GatewayRegistration/GatewayConfigurationForm';
import type { GatewayConfiguration } from '@/modules/GatewayManagement/Models/GatewayConfiguration';
import { DEFAULT_GATEWAY_CONFIGURATION, validateGatewayConfiguration } from '@/modules/GatewayManagement/Models/GatewayConfiguration';

interface Props {
  onRegistered?: (gatewayId: string) => void;
  onCancel?: () => void;
}

const TRANSPORTS: TransportProtocol[] = ['Http', 'Tcp', 'WebSocket'];
const DALI_PROTOCOLS: DaliProtocol[] = ['Dali2', 'Dali1Legacy', 'DaliWireless'];

export const GatewayRegistrationForm: React.FC<Props> = ({ onRegistered, onCancel }) => {
  const { register, isRegistering, registerError, dismissErrors } = useGateways();

  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [transport, setTransport] = useState<TransportProtocol>('Http');
  const [daliProtocol, setDaliProtocol] = useState<DaliProtocol>('Dali2');
  const [endpointHost, setEndpointHost] = useState('');
  const [endpointPort, setEndpointPort] = useState(8080);
  const [endpointPath, setEndpointPath] = useState('');
  const [config, setConfig] = useState<GatewayConfiguration>(DEFAULT_GATEWAY_CONFIGURATION);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'Name is required.';
    if (!identifier.trim()) errors.identifier = 'Identifier is required.';
    if (!endpointHost.trim()) errors.endpointHost = 'Endpoint host is required.';
    if (endpointPort < 1 || endpointPort > 65535) errors.endpointPort = 'Port must be 1-65535.';

    const configVal = validateGatewayConfiguration(config);
    if (!configVal.valid) Object.assign(errors, configVal.errors);

    setLocalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    try {
      const gateway = await register({
        name: name.trim(),
        identifier: identifier.trim(),
        transport,
        daliProtocol,
        endpointHost: endpointHost.trim(),
        endpointPort,
        endpointPath: endpointPath.trim() || null,
        daliLineCount: config.daliLineCount,
        pollingIntervalSeconds: config.pollingIntervalSeconds,
        commandTimeoutSeconds: config.commandTimeoutSeconds,
        authToken: config.authToken,
      });
      onRegistered?.(gateway.id);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    }
  };

  const field = (
    label: string,
    value: string,
    setter: (v: string) => void,
    errorKey: string,
    type: 'text' | 'number' = 'text'
  ) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <label style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => setter(e.target.value)}
        style={{
          padding: '5px 8px',
          background: '#1E293B',
          color: '#E5E7EB',
          border: `1px solid ${localErrors[errorKey] ? '#F87171' : '#1F2937'}`,
          borderRadius: 4,
          fontSize: 12,
          outline: 'none',
        }}
      />
      {localErrors[errorKey] && (
        <span style={{ fontSize: 10, color: '#F87171' }}>{localErrors[errorKey]}</span>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 'bold', color: '#38BDF8', textTransform: 'uppercase' }}>
        Register New Gateway
      </div>

      {field('Name', name, setName, 'name')}
      {field('Identifier', identifier, setIdentifier, 'identifier')}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <label style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase' }}>Transport</label>
          <select
            value={transport}
            onChange={e => setTransport(e.target.value as TransportProtocol)}
            style={{
              padding: '5px 8px',
              background: '#1E293B',
              color: '#E5E7EB',
              border: '1px solid #1F2937',
              borderRadius: 4,
              fontSize: 12,
            }}
          >
            {TRANSPORTS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <label style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase' }}>DALI Protocol</label>
          <select
            value={daliProtocol}
            onChange={e => setDaliProtocol(e.target.value as DaliProtocol)}
            style={{
              padding: '5px 8px',
              background: '#1E293B',
              color: '#E5E7EB',
              border: '1px solid #1F2937',
              borderRadius: 4,
              fontSize: 12,
            }}
          >
            {DALI_PROTOCOLS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {field('Endpoint Host', endpointHost, setEndpointHost, 'endpointHost')}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}>
        {field('Port', String(endpointPort), v => setEndpointPort(Number(v) || 0), 'endpointPort', 'number')}
        {field('Path (optional)', endpointPath, setEndpointPath, 'endpointPath')}
      </div>

      <GatewayConfigurationForm config={config} onChange={setConfig} errors={localErrors} />

      {(submitError || registerError) && (
        <div style={{
          padding: 8,
          background: '#3F1D1D',
          border: '1px solid #F87171',
          borderRadius: 4,
          color: '#F87171',
          fontSize: 11,
        }}>
          {submitError ?? registerError}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        {onCancel && (
          <button
            type="button"
            onClick={() => { dismissErrors(); onCancel(); }}
            disabled={isRegistering}
            style={{
              padding: '6px 14px',
              background: 'transparent',
              border: '1px solid #1F2937',
              borderRadius: 4,
              color: '#94A3B8',
              fontSize: 12,
              cursor: isRegistering ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isRegistering}
          style={{
            padding: '6px 16px',
            background: isRegistering ? '#1F2937' : '#1D4ED8',
            border: 'none',
            borderRadius: 4,
            color: isRegistering ? '#64748B' : '#FFF',
            fontSize: 12,
            fontWeight: 'bold',
            cursor: isRegistering ? 'not-allowed' : 'pointer',
          }}
        >
          {isRegistering ? 'Registering…' : 'Register Gateway'}
        </button>
      </div>
    </form>
  );
};