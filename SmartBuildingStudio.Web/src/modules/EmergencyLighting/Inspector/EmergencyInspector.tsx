// src/modules/EmergencyLighting/Inspector/EmergencyInspector.tsx
//
// Right panel. Element inspector above, compliance panel below, each
// scrolling independently. Compliance is always visible.

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import {
  selectSelectedRouteId,
  selectSelectedEmergencyFixtureId,
  selectSelectedZoneId,
  selectEmergencyFixtureById,
} from '@/modules/EmergencyLighting/store/emergencySelectors';
import { RouteInspectorPanel } from '@/modules/EmergencyLighting/Inspector/RouteInspectorPanel';
import { EmergencyFixtureInspector } from '@/modules/EmergencyLighting/Inspector/EmergencyFixtureInspector';
import { ExitSignInspector } from '@/modules/EmergencyLighting/Inspector/ExitSignInspector';
import { ZoneInspector } from '@/modules/EmergencyLighting/Inspector/ZoneInspector';
import { ComplianceInspector } from '@/modules/EmergencyLighting/Inspector/ComplianceInspector';

export const EmergencyInspector: React.FC = () => {
  const selectedRouteId = useAppSelector(selectSelectedRouteId);
  const selectedFixtureId = useAppSelector(selectSelectedEmergencyFixtureId);
  const selectedZoneId = useAppSelector(selectSelectedZoneId);
  const selectedFixture = useAppSelector((s) =>
    selectEmergencyFixtureById(s, selectedFixtureId)
  );

  const isExitSign =
    selectedFixture?.kind === 'emergencyLight' &&
    selectedFixture.emergencyLight?.classification === 'exit-sign';

  let headerLabel = 'Properties';
  let elementInspector: React.ReactNode = (
    <div style={{ color: '#64748B', fontSize: 11 }}>
      Select a route, emergency fixture, exit sign or zone to inspect it.
    </div>
  );

  if (selectedRouteId) {
    headerLabel = 'Route Inspector';
    elementInspector = (
      <RouteInspectorPanel key={selectedRouteId} routeId={selectedRouteId} />
    );
  } else if (selectedFixtureId && isExitSign) {
    headerLabel = 'Exit Sign Inspector';
    elementInspector = (
      <ExitSignInspector key={selectedFixtureId} fixtureId={selectedFixtureId} />
    );
  } else if (selectedFixtureId) {
    headerLabel = 'Fixture Inspector';
    elementInspector = (
      <EmergencyFixtureInspector key={selectedFixtureId} fixtureId={selectedFixtureId} />
    );
  } else if (selectedZoneId) {
    headerLabel = 'Zone Inspector';
    elementInspector = (
      <ZoneInspector key={selectedZoneId} zoneId={selectedZoneId} />
    );
  }

  return (
    <aside
      style={{
        width: 320,
        flexShrink: 0,
        minHeight: 0,
        background: '#0F1424',
        borderLeft: '1px solid #1E293B',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #1E293B', flexShrink: 0 }}>
          <h2 style={{ color: '#FFF', fontSize: 14, margin: 0 }}>{headerLabel}</h2>
        </div>
        <div
          style={{
            padding: 16,
            overflowY: 'auto',
            flex: 1,
            minHeight: 0,
            color: '#64748B',
            fontSize: 11,
          }}
        >
          {elementInspector}
        </div>
      </div>

      <div
        style={{
          flex: '0 0 40%',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          borderTop: '1px solid #1E293B',
          background: '#0B0F1A',
        }}
      >
        <div
          style={{
            padding: '10px 16px',
            borderBottom: '1px solid #1E293B',
            flexShrink: 0,
          }}
        >
          <h2 style={{ color: '#FFF', fontSize: 12, margin: 0, letterSpacing: 0.4 }}>
            Compliance
          </h2>
        </div>
        <div style={{ padding: 12, overflowY: 'auto', flex: 1, minHeight: 0 }}>
          <ComplianceInspector />
        </div>
      </div>
    </aside>
  );
};

export default EmergencyInspector;