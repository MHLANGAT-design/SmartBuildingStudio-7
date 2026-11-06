// src/modules/DeviceDiscovery/DeviceDiscoveryPage.tsx

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector, store } from '@/Application/ConfigureStore';

import {
  selectSession,
  selectFirstError,
  selectIsSessionLoading,
  selectIsDiscovering,
  selectFloorplan,
} from '@/modules/DeviceDiscovery/Store/deviceDiscoverySelectors';
import {
  selectGateway,
  selectDaliLine,
  clearSession,
  clearErrors,
} from '@/modules/DeviceDiscovery/Store/deviceDiscoverySlice';
import { stopDiscovery } from '@/modules/DeviceDiscovery/Store/deviceDiscoveryThunks';

import { useDiscoveryProgress } from '@/modules/DeviceDiscovery/Hooks/useDiscoveryProgress';

import {
  deviceDiscoveryWorkflow,
  WorkflowCancelledError,
  type WorkflowContext,
} from '@/modules/DeviceDiscovery/Workflows/deviceDiscoveryWorkflow';

import type { DesignFixture } from '@/modules/DeviceDiscovery/Engine/DeviceMatchingEngine';
import { USE_MOCK } from '@/modules/DeviceDiscovery/Services/apiConfig';
import {
  validateStartDiscoveryInput,
  type ValidationIssue,
} from '@/modules/DeviceDiscovery/Utilities/discoveryValidationUtils';

import { DiscoveryToolbar } from '@/modules/DeviceDiscovery/Components/DiscoveryToolbar/DiscoveryToolbar';
import { ProjectSelector } from '@/modules/DeviceDiscovery/Components/ProjectSelector/ProjectSelector';
import { DaliLineSelector } from '@/modules/DeviceDiscovery/Components/DaliLineSelector/DaliLineSelector';
import { DiscoveredDeviceList } from '@/modules/DeviceDiscovery/Components/DiscoveredDeviceList/DiscoveredDeviceList';
import { DiscoveryProgress } from '@/modules/DeviceDiscovery/Components/DiscoveryProgress/DiscoveryProgress';
import { DeviceInspector } from '@/modules/DeviceDiscovery/Components/DeviceInspector/DeviceInspector';
import { DiscoveryResults } from '@/modules/DeviceDiscovery/Components/DiscoveryResults/DiscoveryResults';
import { DeviceDiscoveryCanvas } from '@/modules/DeviceDiscovery/Canvas/DeviceDiscoveryCanvas';
import { CollapsibleSection } from '@/modules/DeviceDiscovery/Components/CollapsibleSection/CollapsibleSection';

const MOCK_GATEWAYS = [
  { gatewayId: 'gw-mock-001', name: 'Mock Gateway 1', isConnected: true },
];

export const DeviceDiscoveryPage: React.FC = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const pathParts = location.pathname.split('/');
  const projectIdFromUrl = pathParts[pathParts.indexOf('projects') + 1];
  const documentIdFromUrl = pathParts[pathParts.indexOf('floorplans') + 1];

  const session = useAppSelector(selectSession);
  const isDiscovering = useAppSelector(selectIsDiscovering);
  const isSessionLoading = useAppSelector(selectIsSessionLoading);
  const firstError = useAppSelector(selectFirstError);
  const floorplan = useAppSelector(selectFloorplan);

  const projectId = projectIdFromUrl || floorplan?.projectId || '';
  const buildingId = floorplan?.buildingId || '';
  const drawingDocumentId = documentIdFromUrl || floorplan?.documentId || '';

  const [selectedGatewayId, setSelectedGatewayId] = useState<string>(
    MOCK_GATEWAYS[0]?.gatewayId ?? ''
  );
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<ValidationIssue[]>([]);

  const progress = useDiscoveryProgress({ pollMs: 0 });

  const linesForDrawing = useMemo(() => floorplan?.daliLines ?? [], [floorplan]);

  useEffect(() => {
    if (linesForDrawing.length > 0 && !selectedLineId) {
      setSelectedLineId(linesForDrawing[0].lineId);
    }
  }, [linesForDrawing, selectedLineId]);

  const designFixtures = useMemo<DesignFixture[]>(() => {
    if (!floorplan || !floorplan.fixtures) return [];
    return floorplan.fixtures
      .filter(f => f.lineId)
      .map(f => ({
        fixtureId: String(f.id),
        lineId: String(f.lineId),
        expectedShortAddress: f.shortAddress ?? null,
        expectedDeviceType: 'LED_DIMMABLE',
        requiredCapabilities: ['DIMMABLE'],
        label: f.productName || String(f.id),
      }));
  }, [floorplan]);

  const uiFloors = useMemo(() => {
    if (!floorplan?.floorId) return [];
    return [{ floorId: floorplan.floorId, name: floorplan.floorName }];
  }, [floorplan]);

  const uiDrawings = useMemo(() => {
    if (!floorplan?.documentId) return [];
    return [{ drawingDocumentId: floorplan.documentId, name: floorplan.documentName }];
  }, [floorplan]);

  const handleFloorSelect = useCallback((_floorId: string) => {}, []);
  const handleDrawingSelect = useCallback((_drawingId: string) => {}, []);

  const handleLineSelect = useCallback((lineId: string) => {
    if (lineId === selectedLineId) return;
    setSelectedLineId(lineId);
    dispatch(selectDaliLine(lineId));
  }, [dispatch, selectedLineId]);

  const handleGatewaySelect = useCallback(
    (gatewayId: string) => {
      if (isDiscovering) return;
      setSelectedGatewayId(gatewayId);
      dispatch(selectGateway(gatewayId));
    },
    [dispatch, isDiscovering]
  );

  const handleStart = useCallback(async () => {
    const issues = validateStartDiscoveryInput({
      gatewayId: selectedGatewayId,
      scope: {
        projectId,
        buildingId,
        floorId: floorplan?.floorId || '',
        drawingDocumentId,
        daliLineIds: selectedLineId ? [selectedLineId] : [],
      },
      session,
    });
    setFormErrors(issues);
    if (issues.length > 0) return;

    // Clear any previous session/devices before starting a new scan.
    // This is what fixes the "unknown until hard refresh" bug when
    // navigating between modules.
    dispatch(clearSession());
    dispatch(clearErrors());

    const ctx: WorkflowContext = {
      dispatch,
      getState: () => store.getState(),
    };

    try {
      await deviceDiscoveryWorkflow.run(ctx, {
        gatewayId: selectedGatewayId,
        scope: {
          projectId,
          buildingId,
          floorId: floorplan?.floorId || '',
          drawingDocumentId,
          daliLineIds: selectedLineId ? [selectedLineId] : [],
        },
        designFixtures: designFixtures,
        simulate: USE_MOCK,
      });
    } catch (err) {
      if (err instanceof WorkflowCancelledError) return;
      console.error('[DeviceDiscovery] Discovery failed', err);
    }
  }, [
    dispatch,
    selectedGatewayId,
    selectedLineId,
    projectId,
    buildingId,
    drawingDocumentId,
    session,
    designFixtures,
    floorplan,
  ]);

  const handleStop = useCallback(async () => {
    if (!session?.sessionId) return;
    try {
      await dispatch(stopDiscovery({ sessionId: session.sessionId })).unwrap();
    } catch (err) {
      console.error('[DeviceDiscovery] Stop failed', err);
    }
  }, [dispatch, session?.sessionId]);

  const handleClearError = useCallback(() => {
    dispatch(clearErrors());
  }, [dispatch]);

  const showResults =
    session?.status === 'COMPLETED' || session?.status === 'STOPPING';
  const showProgress = !showResults && (isDiscovering || isSessionLoading);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        background: '#0A0F1E',
        color: '#E5E7EB',
      }}
    >
      <DiscoveryToolbar
        onStart={handleStart}
        onStop={handleStop}
        isDiscovering={isDiscovering}
        isLoading={isSessionLoading}
      />

      {formErrors.length > 0 && (
        <div
          style={{
            padding: '6px 16px',
            background: '#3F2D0F',
            borderBottom: '1px solid #FBBF24',
            color: '#FBBF24',
            fontSize: 11,
            flexShrink: 0,
          }}
        >
          {formErrors.map(e => (
            <div key={e.field}>{e.message}</div>
          ))}
        </div>
      )}

      {firstError && (
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
          <span>{firstError}</span>
          <button
            type="button"
            onClick={handleClearError}
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

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* ---- Left Sidebar ---- */}
        <aside
          aria-label="Discovery context"
          style={{
            width: 320,
            flexShrink: 0,
            borderRight: '1px solid #1F2937',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          {/* Context panels (collapsible) */}
          <CollapsibleSection title="Gateway" defaultOpen={false}>
            <select
              value={selectedGatewayId}
              onChange={e => handleGatewaySelect(e.target.value)}
              disabled={isDiscovering}
              style={{
                width: '100%',
                padding: '4px 6px',
                background: '#1E293B',
                color: '#E5E7EB',
                border: '1px solid #1F2937',
                borderRadius: 4,
                fontSize: 11,
              }}
            >
              {MOCK_GATEWAYS.map(g => (
                <option key={g.gatewayId} value={g.gatewayId}>
                  {g.name}
                  {g.isConnected ? '' : ' (offline)'}
                </option>
              ))}
            </select>
          </CollapsibleSection>

          <CollapsibleSection title="Project" defaultOpen={false}>
            <ProjectSelector
              projectName={floorplan?.projectName || 'Loading...'}
              floors={uiFloors}
              drawings={uiDrawings}
              selectedFloorId={floorplan?.floorId || ''}
              selectedDrawingId={drawingDocumentId}
              onFloorSelect={handleFloorSelect}
              onDrawingSelect={handleDrawingSelect}
              disabled={isDiscovering}
            />
          </CollapsibleSection>

          <CollapsibleSection title="DALI Line" defaultOpen={false}>
            <DaliLineSelector
              lines={linesForDrawing}
              selectedLineId={selectedLineId}
              onSelect={handleLineSelect}
              disabled={isDiscovering || !drawingDocumentId}
            />
          </CollapsibleSection>

          {/* Device list — the main event */}
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <DiscoveredDeviceList />
          </div>
        </aside>

        {/* ---- Main Content ---- */}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {showProgress && (
            <DiscoveryProgress
              phase={progress.phase}
              percent={progress.percent}
              message={progress.label}
              hideWhenIdle={false}
            />
          )}

          <div
            style={{
              flex: 1,
              minHeight: 320,
              borderBottom: '1px solid #1F2937',
              position: 'relative',
            }}
          >
            <DeviceDiscoveryCanvas
              floorplanId={drawingDocumentId}
              projectId={projectId}
            />
          </div>

          <div
            style={{
              maxHeight: '35vh',
              overflowY: 'auto',
              padding: 24,
              paddingBottom: 56,
              borderTop: '1px solid #1F2937',
              background: '#0A0F1E',
            }}
          >
            {showResults ? (
              <DiscoveryResults />
            ) : (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748B',
                  fontSize: 13,
                  textAlign: 'center',
                }}
              >
                {isDiscovering
                  ? 'Discovery in progress — devices will appear on the plan and in the left panel as they are found.'
                  : 'Select a gateway, floor, drawing, and DALI line, then press Start Discovery.'}
              </div>
            )}
          </div>
        </main>

        {/* ---- Right Sidebar ---- */}
        <aside
          aria-label="Device inspector"
          style={{
            width: 320,
            flexShrink: 0,
            borderLeft: '1px solid #1F2937',
            minHeight: 0,
            overflowY: 'auto',
            paddingBottom: 56,
          }}
        >
          <DeviceInspector />
        </aside>
      </div>
    </div>
  );
};

export default DeviceDiscoveryPage;