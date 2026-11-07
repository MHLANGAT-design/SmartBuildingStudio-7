// src/modules/Commissioning/Dialogs/NetworkTestDialog.tsx

import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Footer,
  Field,
  inputStyle,
  errorStyle,
} from '@/modules/Commissioning/Dialogs/StartCommissioningDialog';
import { useNetworkTesting } from '@/modules/Commissioning/hooks/useNetworkTesting';
import { useGateways } from '@/modules/GatewayManagement/Hooks/useGateways';
import { useFloorplanDaliLines } from '@/modules/Commissioning/hooks/useFloorplanDaliLines';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const NetworkTestDialog: React.FC<Props> = ({ isOpen, onClose }) => {
  const { runNetworkTest, isTesting } = useNetworkTesting();
  const {
    gateways: allGateways,
    connected,
    isLoading: gatewaysLoading,
    refresh: refreshGateways,
  } = useGateways();
  const {
    lines,
    isLoading: linesLoading,
    error: linesError,
  } = useFloorplanDaliLines();

  // Normalise the Gateway model to what this dialog needs.
  const availableGateways = useMemo(() => {
    const source = connected.length > 0 ? connected : allGateways;
    return source
      .map((g: any) => ({
        gatewayId: String(g.gatewayId ?? g.id ?? ''),
        name: String(
          g.name ?? g.displayName ?? g.label ?? g.gatewayId ?? g.id ?? 'Unknown gateway',
        ),
        status: String(g.status ?? g.connectionStatus ?? '').toUpperCase(),
      }))
      .filter((g) => g.gatewayId.length > 0);
  }, [connected, allGateways]);

  const [gatewayId, setGatewayId] = useState('');
  const [lineId, setLineId] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch gateway list on dialog open (useGateways doesn't auto-load).
  useEffect(() => {
    if (!isOpen) return;
    refreshGateways().catch(() => {});
  }, [isOpen, refreshGateways]);

  // Default gateway → first connected (or first available).
  useEffect(() => {
    if (availableGateways.length === 0) return;
    setGatewayId((current) => current || availableGateways[0].gatewayId);
  }, [availableGateways]);

  // Default line → first DALI line for this floorplan.
  useEffect(() => {
    if (lines.length === 0) return;
    setLineId((current) => current || lines[0].lineId);
  }, [lines]);

  if (!isOpen) return null;

  const canRun =
    !!gatewayId &&
    !!lineId &&
    !isTesting &&
    (availableGateways.length > 0 || !gatewaysLoading) &&
    (lines.length > 0 || !linesLoading);

  const displayedError = error ?? linesError ?? null;

  const handleRun = async () => {
    if (!gatewayId || !lineId) {
      setError('A target gateway and DALI line are required.');
      return;
    }
    try {
      setError(null);
      await runNetworkTest(gatewayId, lineId);
      onClose();
    } catch (e: any) {
      setError(e?.message ?? 'Network verification failed.');
    }
  };

  const gatewayLabel = (g: (typeof availableGateways)[number]) =>
    g.status === 'CONNECTED' ? `${g.name} (Connected)` : g.name;

  return (
    <Modal onClose={onClose} title="Network Verification Test">
      <div style={{ color: '#94A3B8', fontSize: 11, marginBottom: 16 }}>
        Run a full diagnostic sweep on the target DALI line.
      </div>

      {displayedError && <div style={errorStyle}>{displayedError}</div>}

      <Field label="Target Gateway">
        <select
          value={gatewayId}
          onChange={(e) => setGatewayId(e.target.value)}
          style={inputStyle}
          disabled={isTesting || availableGateways.length === 0}
        >
          {availableGateways.length === 0 && (
            <option key="__gw_placeholder" value="">
              {gatewaysLoading ? 'Loading gateways…' : 'No gateways available'}
            </option>
          )}
          {availableGateways.map((g) => (
            <option key={g.gatewayId} value={g.gatewayId}>
              {gatewayLabel(g)}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Target DALI Line">
        <select
          value={lineId}
          onChange={(e) => setLineId(e.target.value)}
          style={inputStyle}
          disabled={isTesting || lines.length === 0}
        >
          {lines.length === 0 && (
            <option key="__line_placeholder" value="">
              {linesLoading ? 'Loading lines…' : 'No DALI lines for this floorplan'}
            </option>
          )}
          {lines.map((l) => (
            <option key={l.lineId} value={l.lineId}>
              {l.name} — {l.lineId}
            </option>
          ))}
        </select>
      </Field>

      <Footer
        onCancel={onClose}
        onConfirm={handleRun}
        confirmLabel={isTesting ? 'Testing…' : 'Run Network Test'}
        confirmDisabled={!canRun}
      />
    </Modal>
  );
};