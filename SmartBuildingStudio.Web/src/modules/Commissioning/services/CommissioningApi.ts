// src/modules/Commissioning/services/CommissioningApi.ts

import { API_ROUTES } from '@/Application/ApiRoutes';
import {
  USE_MOCK,
  mockDelay,
  nowIso,
} from '@/modules/Commissioning/services/apiConfig';
import type { CommissioningSession } from '@/modules/Commissioning/models/CommissioningSession';
import type { CommissioningReport } from '@/modules/Commissioning/models/CommissioningReport';
import type { DeviceState } from '@/modules/Commissioning/models/DeviceState';
import type { NetworkState } from '@/modules/Commissioning/models/NetworkState';
import type { TestResult } from '@/modules/Commissioning/models/TestResult';
import type { Fault } from '@/modules/Commissioning/models/Fault';
import type { SceneTest } from '@/modules/Commissioning/models/SceneTest';
import type { SignalLog } from '@/modules/Commissioning/models/SignalLog';

export class CommissioningApi {
  // ── Session lifecycle ───────────────────────────────────────────

  public static async startSession(
    projectId: string,
    floorId: string,
  ): Promise<CommissioningSession> {
    if (USE_MOCK) {
      await mockDelay(150);
      return {
        sessionId: `session-${Date.now()}`,
        projectId,
        floorId,
        status: 'IDLE',
        startedAt: nowIso(),
        completedAt: null,
        startedBy: 'current-user',
        deviceStates: {},
        networkStates: {
          'line-mock-01': {
            gatewayId: 'gw-mock-001',
            lineId: 'line-mock-01',
            isConnected: true,
            totalDevices: 0,
            onlineDevices: 0,
            errorCount: 0,
            lastScanAt: nowIso(),
            busVoltage: 16,
          },
        },
        activeFaults: [],
      };
    }
    const res = await fetch(API_ROUTES.COMMISSIONING_SERVICE.START, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, floorId }),
    });
    if (!res.ok) throw new Error('Failed to start commissioning session');
    return res.json();
  }

  public static async saveSessionState(session: CommissioningSession): Promise<void> {
    if (USE_MOCK) {
      await mockDelay(100);
      return;
    }
    const res = await fetch(API_ROUTES.COMMISSIONING_SERVICE.SESSION, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    });
    if (!res.ok) throw new Error('Failed to save commissioning session state');
  }

  public static async generateReport(sessionId: string): Promise<CommissioningReport> {
    if (USE_MOCK) {
      await mockDelay(200);
      return {
        reportId: `report-${Date.now()}`,
        sessionId,
        projectId: 'mock-project',
        generatedAt: nowIso(),
        totalDevices: 0,
        testedDevices: 0,
        faults: [],
        testResults: [],
        overallStatus: 'READY_FOR_HANDOVER',
      };
    }
    const res = await fetch(API_ROUTES.COMMISSIONING_SERVICE.REPORT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    if (!res.ok) throw new Error('Failed to generate commissioning report');
    return res.json();
  }

  // ── Device discovery & state ────────────────────────────────────

  public static async discoverDevices(
    gatewayId: string,
    lineId: string,
  ): Promise<DeviceState[]> {
    if (USE_MOCK) {
      await mockDelay(300);
      // Return 3 plausible devices so DeviceDiscoveryEngine's empty-array
      // guard passes and downstream tests have data to work with.
      return [
        {
          deviceId: `${lineId}-dev-001`,
          address: 1,
          isOnline: true,
          level: 0,
          lastSeenAt: nowIso(),
          errorCount: 0,
        } as unknown as DeviceState,
        {
          deviceId: `${lineId}-dev-002`,
          address: 2,
          isOnline: true,
          level: 0,
          lastSeenAt: nowIso(),
          errorCount: 0,
        } as unknown as DeviceState,
        {
          deviceId: `${lineId}-dev-003`,
          address: 3,
          isOnline: true,
          level: 0,
          lastSeenAt: nowIso(),
          errorCount: 0,
        } as unknown as DeviceState,
      ];
    }
    const res = await fetch(
      API_ROUTES.COMMISSIONING_SERVICE.DEVICES_DISCOVER(gatewayId, lineId),
      { method: 'POST' },
    );
    if (!res.ok) throw new Error('Device discovery failed');
    return res.json();
  }

  public static async getDeviceState(deviceId: string): Promise<DeviceState> {
    if (USE_MOCK) {
      await mockDelay(80);
      return {
        deviceId,
        address: 0,
        isOnline: false,
        level: 0,
        lastSeenAt: nowIso(),
        errorCount: 0,
      } as unknown as DeviceState;
    }
    const res = await fetch(API_ROUTES.COMMISSIONING_SERVICE.DEVICE_STATE(deviceId));
    if (!res.ok) throw new Error(`Failed to fetch state for device ${deviceId}`);
    return res.json();
  }

  // ── Network state ───────────────────────────────────────────────

  public static async getNetworkState(
    gatewayId: string,
    lineId: string,
  ): Promise<NetworkState> {
    if (USE_MOCK) {
      await mockDelay(100);
      return {
        gatewayId,
        lineId,
        isConnected: true,
        totalDevices: 0,
        onlineDevices: 0,
        errorCount: 0,
        lastScanAt: nowIso(),
        busVoltage: 16,
      };
    }
    const res = await fetch(
      API_ROUTES.COMMISSIONING_SERVICE.NETWORK_STATE(gatewayId, lineId),
    );
    if (!res.ok) throw new Error('Failed to fetch network state');
    return res.json();
  }

  public static async resetBus(gatewayId: string, lineId: string): Promise<void> {
    if (USE_MOCK) {
      await mockDelay(150);
      return;
    }
    const res = await fetch(
      API_ROUTES.COMMISSIONING_SERVICE.NETWORK_RESET(gatewayId, lineId),
      { method: 'POST' },
    );
    if (!res.ok) throw new Error('Bus reset failed');
  }

  // ── Tests ───────────────────────────────────────────────────────

  public static async testDeviceSignal(deviceId: string): Promise<TestResult> {
    if (USE_MOCK) {
      await mockDelay(120);
      return {
        testId: `test-${Date.now()}`,
        deviceId,
        testType: 'SIGNAL',
        status: 'PASSED',
        executedAt: nowIso(),
        durationMs: 120,
        details: 'Mock signal test',
      } as unknown as TestResult;
    }
    const res = await fetch(API_ROUTES.COMMISSIONING_SERVICE.TEST_SIGNAL(deviceId), {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Signal test failed to execute');
    return res.json();
  }

  public static async testNetworkLine(
    gatewayId: string,
    lineId: string,
  ): Promise<TestResult[]> {
    if (USE_MOCK) {
      await mockDelay(400);
      // FIX: was `return [];`. Returning an empty array kept recentTestResults
      // empty, so ValidationGroup's `testResultCount > 0` gate left Generate
      // Report disabled even after the workflow reached COMPLETED. Return a
      // realistic PASSED fixture so the gate opens.
      return [
        {
          testId: `t-${lineId}-1`,
          deviceId: `${lineId}-dev-001`,
          testType: 'NETWORK',
          status: 'PASSED',
          executedAt: nowIso(),
          durationMs: 12,
        } as unknown as TestResult,
        {
          testId: `t-${lineId}-2`,
          deviceId: `${lineId}-dev-002`,
          testType: 'NETWORK',
          status: 'PASSED',
          executedAt: nowIso(),
          durationMs: 15,
        } as unknown as TestResult,
        {
          testId: `t-${lineId}-3`,
          deviceId: `${lineId}-dev-003`,
          testType: 'NETWORK',
          status: 'PASSED',
          executedAt: nowIso(),
          durationMs: 11,
        } as unknown as TestResult,
      ];
    }
    const res = await fetch(API_ROUTES.COMMISSIONING_SERVICE.TEST_NETWORK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gatewayId, lineId }),
    });
    if (!res.ok) throw new Error('Network test failed to execute');
    return res.json();
  }

  // ── Faults ──────────────────────────────────────────────────────

  public static async getActiveFaults(sessionId: string): Promise<Fault[]> {
    if (USE_MOCK) {
      await mockDelay(80);
      return [];
    }
    const res = await fetch(API_ROUTES.COMMISSIONING_SERVICE.SESSION_FAULTS(sessionId));
    if (!res.ok) throw new Error('Failed to fetch active faults');
    return res.json();
  }

  public static async resolveFault(faultId: string, notes: string): Promise<Fault> {
    if (USE_MOCK) {
      await mockDelay(100);
      return {
        faultId,
        resolvedAt: nowIso(),
        resolvedBy: 'current-user',
        notes,
      } as unknown as Fault;
    }
    const res = await fetch(API_ROUTES.COMMISSIONING_SERVICE.RESOLVE_FAULT(faultId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    if (!res.ok) throw new Error('Failed to resolve fault');
    return res.json();
  }

  // ── Scenes ──────────────────────────────────────────────────────

  public static async executeSceneTest(sceneId: string): Promise<SceneTest> {
    if (USE_MOCK) {
      await mockDelay(250);
      return {
        sceneId,
        status: 'PASSED',
        executedAt: nowIso(),
        deviceResults: [],
      } as unknown as SceneTest;
    }
    const res = await fetch(API_ROUTES.COMMISSIONING_SERVICE.TEST_SCENE(sceneId), {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`Failed to execute scene test for ${sceneId}`);
    return res.json();
  }

  // ── Signals ─────────────────────────────────────────────────────

  public static async getSignalLogs(deviceId: string): Promise<SignalLog[]> {
    if (USE_MOCK) {
      await mockDelay(80);
      return [];
    }
    const res = await fetch(API_ROUTES.COMMISSIONING_SERVICE.SIGNAL_LOGS(deviceId));
    if (!res.ok) throw new Error('Failed to fetch signal logs');
    return res.json();
  }
}