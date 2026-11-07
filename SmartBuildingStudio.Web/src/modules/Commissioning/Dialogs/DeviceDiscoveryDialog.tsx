// src/modules/Commissioning/Dialogs/DeviceDiscoveryDialog.tsx

import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Footer,
  Field,
  inputStyle,
  errorStyle,
} from '@/modules/Commissioning/Dialogs/StartCommissioningDialog';
import { useDeviceDiscovery } from '@/modules/Commissioning/hooks/useDeviceDiscovery';
import { useFloorplanDaliLines } from '@/modules/Commissioning/hooks/useFloorplanDaliLines';
import { useGateways } from '@/modules/GatewayManagement/Hooks/useGateways';
import {
  DiscoverySummaryDialog,
  type DiscoverySummary,
} from '@/modules/Commissioning/Dialogs/DiscoverySummaryDialog';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DeviceDiscoveryDialog: React.FC<Props> = ({ isOpen, onClose }) => {
  const { discoverDevices, isDiscovering, error: storeError } = useDeviceDiscovery();
  const {
    gateways: allGateways,
    connected,
    isLoading: gatewaysLoading,
    refresh: refreshGateways,
  } = useGateways();
  const { lines, fixtures, isLoading: linesLoading, error: linesError } =
    useFloorplanDaliLines();

  const availableGateways = useMemo(() => {
    const source = connected.length > 0 ? connected : allGateways;
    return source
      .map((g: any) => ({
        gatewayId: String(g.gatewayId ?? g.id ?? ''),
        name: String(
          g.name ?? g.displayName ?? g.label ?? g.gatewayId ?? g.id ?? 'Unknown gateway',
        ),
        status: String(g.status ?? g.connectionStatus ?? '').toUpperCase(),
        _raw: g,
      }))
      .filter((g) => g.gatewayId.length > 0);
  }, [connected, allGateways]);

  const [gatewayId, setGatewayId] = useState('');
  const [lineId, setLineId] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DiscoverySummary | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    refreshGateways().catch(() => {});
  }, [isOpen, refreshGateways]);

  useEffect(() => {
    if (availableGateways.length === 0) return;
    setGatewayId((current) => current || availableGateways[0].gatewayId);
  }, [availableGateways]);

  useEffect(() => {
    if (lines.length === 0) return;
    setLineId((current) => current || lines[0].lineId);
  }, [lines]);

  const gatewaysResolved = !gatewaysLoading || availableGateways.length > 0;
  const linesResolved = !linesLoading || lines.length > 0;

  const canScan = useMemo(
    () =>
      !!gatewayId &&
      !!lineId &&
      !isDiscovering &&
      gatewaysResolved &&
      linesResolved,
    [gatewayId, lineId, isDiscovering, gatewaysResolved, linesResolved],
  );

  if (!isOpen) return null;

  const displayedError = localError ?? storeError ?? linesError ?? null;

  const handleDiscover = async () => {
    if (!gatewayId || !lineId) {
      setLocalError('A target gateway and DALI line are required.');
      return;
    }
    try {
      setLocalError(null);
      const result = await discoverDevices(gatewayId, lineId, fixtures);
      // Show summary first; parent closes when summary is dismissed.
      setSummary(result.summary);
    } catch (e: any) {
      setLocalError(
        e?.message ?? 'Discovery failed. Check the gateway connection and try again.',
      );
    }
  };

  const gatewayLabel = (g: (typeof availableGateways)[number]) =>
    g.status === 'CONNECTED' ? `${g.name} (Connected)` : g.name;

  return (
    <>
      <Modal onClose={onClose} title="Discover Devices">
        <div style={{ color: '#94A3B8', fontSize: 11, marginBottom: 16 }}>
          Scan a specific DALI line to find and register physical devices.
        </div>

        {displayedError && <div style={errorStyle}>{displayedError}</div>}

        <Field label="Target Gateway">
          <select
            value={gatewayId}
            onChange={(e) => setGatewayId(e.target.value)}
            style={inputStyle}
            disabled={isDiscovering || availableGateways.length === 0}
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
            disabled={isDiscovering || lines.length === 0}
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
          onConfirm={handleDiscover}
          confirmLabel={isDiscovering ? 'Scanning…' : 'Start Scan'}
          confirmDisabled={!canScan}
        />
      </Modal>

      <DiscoverySummaryDialog
        summary={summary}
        onClose={() => {
          setSummary(null);
          onClose();
        }}
      />
    </>
  );
};