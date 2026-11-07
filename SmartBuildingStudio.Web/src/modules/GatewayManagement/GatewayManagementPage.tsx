// src/modules/GatewayManagement/GatewayManagementPage.tsx

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useGateways } from '@/modules/GatewayManagement/Hooks/useGateways';

import { GatewayList } from '@/modules/GatewayManagement/Components/GatewayRegistry/GatewayList';
import { GatewayDetails } from '@/modules/GatewayManagement/Components/GatewayRegistry/GatewayDetails';
import { GatewayAssignments } from '@/modules/GatewayManagement/Components/GatewayRegistry/GatewayAssignments';
import { GatewayDashboard } from '@/modules/GatewayManagement/Components/GatewayDashboard/GatewayDashboard';
import { GatewayRegistrationForm } from '@/modules/GatewayManagement/Components/GatewayRegistration/GatewayRegistrationForm';
import { GatewayIntegrationPanel } from '@/modules/GatewayManagement/Components/GatewayIntegration/GatewayIntegrationPanel';
import { GatewayOperationsPanel } from '@/modules/GatewayManagement/Components/GatewayOperations/GatewayOperationsPanel';
import { GatewayDiagnosticsPanel } from '@/modules/GatewayManagement/Components/GatewayDiagnostics/GatewayDiagnosticsPanel';
import { EventLog } from '@/modules/GatewayManagement/Components/GatewayEvents/EventLog';

import type { ConnectionStatus } from '@/modules/GatewayManagement/Models/Gateway';

type Tab = 'dashboard' | 'integration' | 'operations' | 'diagnostics' | 'events';

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'integration', label: 'Integration' },
  { key: 'operations', label: 'Operations' },
  { key: 'diagnostics', label: 'Diagnostics' },
  { key: 'events', label: 'Events' },
];

const STATUS_COLOR: Record<ConnectionStatus, string> = {
  Disconnected: '#64748B',
  Connecting: '#FBBF24',
  Connected: '#4ADE80',
  Reconnecting: '#FBBF24',
  Error: '#F87171',
};

export const GatewayManagementPage: React.FC = () => {
  const {
    gateways,
    selectedGatewayId,
    selectedGateway,
    anyLoading,
    isRegistering,
    error,
    registerError,
    select,
    refresh,
    dismissErrors,
  } = useGateways();

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [showRegistration, setShowRegistration] = useState(false);

  useEffect(() => {
    void refresh().catch(() => { /* error slot populated */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = useCallback(() => {
    void refresh().catch(() => { /* error slot populated */ });
  }, [refresh]);

  const handleRegistrationComplete = useCallback(() => {
    setShowRegistration(false);
    void refresh().catch(() => { /* error slot populated */ });
  }, [refresh]);

  const handleRegistrationCancel = useCallback(() => {
    setShowRegistration(false);
    dismissErrors();
  }, [dismissErrors]);

  const statusColor = useMemo(
    () => (selectedGateway ? STATUS_COLOR[selectedGateway.connectionStatus] : '#64748B'),
    [selectedGateway]
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#0A0F1E',
        color: '#E5E7EB',
      }}
    >
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        height: 48,
        background: '#0F1424',
        borderBottom: '1px solid #1F2937',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 14, fontWeight: 'bold', color: '#38BDF8' }}>
          Gateway Management
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleRefresh}
            disabled={anyLoading}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              border: '1px solid #1F2937',
              borderRadius: 4,
              color: anyLoading ? '#64748B' : '#E5E7EB',
              fontSize: 12,
              cursor: anyLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {anyLoading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            onClick={() => setShowRegistration(true)}
            disabled={isRegistering}
            style={{
              padding: '6px 12px',
              background: isRegistering ? '#1F2937' : '#1D4ED8',
              color: isRegistering ? '#64748B' : '#FFF',
              border: 'none',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 'bold',
              cursor: isRegistering ? 'not-allowed' : 'pointer',
            }}
          >
            Register Gateway
          </button>
        </div>
      </div>

      {/* Error banner */}
      {(error || registerError) && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px',
            background: '#3F1D1D',
            borderBottom: '1px solid #F87171',
            color: '#F87171',
            fontSize: 12,
            flexShrink: 0,
          }}
        >
          <span>{error ?? registerError}</span>
          <button
            onClick={dismissErrors}
            style={{
              background: 'transparent',
              border: '1px solid #F87171',
              borderRadius: 4,
              color: '#F87171',
              fontSize: 11,
              padding: '2px 8px',
              cursor: 'pointer',
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Registration modal */}
      {showRegistration && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={e => {
            if (e.target === e.currentTarget) handleRegistrationCancel();
          }}
        >
          <div
            style={{
              width: 480,
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#0F1424',
              border: '1px solid #1F2937',
              borderRadius: 8,
              padding: 24,
            }}
          >
            <GatewayRegistrationForm
              onRegistered={handleRegistrationComplete}
              onCancel={handleRegistrationCancel}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* Left column */}
        <aside
          style={{
            width: 360,
            flexShrink: 0,
            borderRight: '1px solid #1F2937',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <div style={{
            padding: '10px 12px',
            borderBottom: '1px solid #1F2937',
            fontSize: 11,
            fontWeight: 'bold',
            color: '#38BDF8',
            textTransform: 'uppercase',
            flexShrink: 0,
          }}>
            Gateway Registry
          </div>
          <div style={{
            flex: 1,
            minHeight: 0,
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
          }}>
            <GatewayList
              gateways={gateways}
              selectedGatewayId={selectedGatewayId}
              onSelect={select}
            />
          </div>
        </aside>

        {/* Center */}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minHeight: 0,
          }}
        >
          <div
            role="tablist"
            style={{
              display: 'flex',
              borderBottom: '1px solid #1F2937',
              background: '#0F1424',
              flexShrink: 0,
            }}
          >
            {TABS.map(tab => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: '10px 16px',
                    background: active ? '#0A0F1E' : 'transparent',
                    border: 'none',
                    borderBottom: `2px solid ${active ? '#38BDF8' : 'transparent'}`,
                    color: active ? '#38BDF8' : '#94A3B8',
                    fontSize: 12,
                    fontWeight: active ? 'bold' : 'normal',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {activeTab === 'dashboard' && (
              <GatewayDashboard loadOnMount={false} />
            )}
            {activeTab === 'integration' && (
              <GatewayIntegrationPanel gatewayId={selectedGatewayId} />
            )}
            {activeTab === 'operations' && (
              <GatewayOperationsPanel gatewayId={selectedGatewayId} />
            )}
            {activeTab === 'diagnostics' && (
              <GatewayDiagnosticsPanel gatewayId={selectedGatewayId} />
            )}
            {activeTab === 'events' && (
              <div style={{ padding: 16 }}>
                <div style={{
                  fontSize: 11,
                  color: '#64748B',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}>
                  Gateway Events
                </div>
                <EventLog />
              </div>
            )}
          </div>
        </main>

        {/* Right column */}
        <aside
          style={{
            width: 340,
            flexShrink: 0,
            borderLeft: '1px solid #1F2937',
            overflowY: 'auto',
            minHeight: 0,
          }}
        >
          <div style={{
            padding: '10px 16px',
            borderBottom: '1px solid #1F2937',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            position: 'sticky',
            top: 0,
            background: '#0A0F1E',
            zIndex: 1,
          }}>
            <span style={{
              fontSize: 11,
              fontWeight: 'bold',
              color: '#38BDF8',
              textTransform: 'uppercase',
            }}>
              Selected Gateway
            </span>
            {selectedGateway && (
              <span style={{
                padding: '2px 8px',
                borderRadius: 10,
                background: `${statusColor}22`,
                border: `1px solid ${statusColor}66`,
                color: statusColor,
                fontSize: 10,
                fontWeight: 'bold',
                textTransform: 'uppercase',
                flexShrink: 0,
              }}>
                {selectedGateway.connectionStatus}
              </span>
            )}
          </div>

          <div style={{ padding: 16, borderBottom: '1px solid #1F2937' }}>
            <GatewayDetails gateway={selectedGateway} />
          </div>

          <div style={{ padding: 16 }}>
            <GatewayAssignments gatewayId={selectedGatewayId} />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default GatewayManagementPage;