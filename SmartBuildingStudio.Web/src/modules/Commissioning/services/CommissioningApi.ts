// src/modules/Commissioning/services/CommissioningApi.ts

import { API_ROUTES } from '@/Application/ApiRoutes';
import {
  USE_MOCK,
  mockDelay,
  nowIso,
  API_BASE_URL,
} from '@/modules/Commissioning/services/apiConfig';
import type { CommissioningSession } from '@/modules/Commissioning/models/CommissioningSession';
import type { CommissioningReport } from '@/modules/Commissioning/models/CommissioningReport';
import type { DeviceState } from '@/modules/Commissioning/models/DeviceState';
import type { NetworkState } from '@/modules/Commissioning/models/NetworkState';
import type { TestResult } from '@/modules/Commissioning/models/TestResult';
import type { Fault } from '@/modules/Commissioning/models/Fault';
import type { SceneTest } from '@/modules/Commissioning/models/SceneTest';
import type { SignalLog } from '@/modules/Commissioning/models/SignalLog';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`API Error ${res.status}: ${errorBody}`);
  }
  return res.json();
}

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

    const res = await fetch(`${API_BASE_URL}/api/commissioning/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, floorplanId: floorId, startedBy: 'current-user' }),
    });
    const dto = await handleResponse<any>(res);

    return {
      sessionId: dto.sessionId,
      projectId: dto.projectId,
      floorId: dto.floorplanId,
      status: dto.status?.toUpperCase() || 'IDLE',
      startedAt: dto.startedAt,
      completedAt: dto.completedAt,
      startedBy: dto.startedBy,
      deviceStates: {},
      networkStates: {},
      activeFaults: [],
    };
  }

  public static async saveSessionState(session: CommissioningSession): Promise<void> {
    if (USE_MOCK) {
      await mockDelay(100);
      return;
    }
    const res = await fetch(`${API_BASE_URL}/api/commissioning/session`, {
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
    const res = await fetch(`${API_BASE_URL}/api/commissioning/session/${sessionId}/report`, {
      method: 'GET',
    });
    return handleResponse<CommissioningReport>(res);
  }

  // ── Device discovery & state ────────────────────────────────────

  public static async discoverDevices(
    gatewayId: string,
    lineId: string,
    sessionId: string,
  ): Promise<DeviceState[]> {
    if (USE_MOCK) {
      await mockDelay(300);
      return [
        { deviceId: `${lineId}-dev-001`, address: 1, isOnline: true, level: 0, lastSeenAt: nowIso(), errorCount: 0 } as unknown as DeviceState,
        { deviceId: `${lineId}-dev-002`, address: 2, isOnline: true, level: 0, lastSeenAt: nowIso(), errorCount: 0 } as unknown as DeviceState,
        { deviceId: `${lineId}-dev-003`, address: 3, isOnline: true, level: 0, lastSeenAt: nowIso(), errorCount: 0 } as unknown as DeviceState,
      ];
    }
    const res = await fetch(`${API_BASE_URL}/api/commissioning/session/${sessionId}/devices/discover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gatewayId, lineId }),
    });
    const dtos = await handleResponse<any[]>(res);
    return dtos.map((d: any) => ({
      deviceId: d.externalId,
      shortAddress: d.shortAddress,
      connectionStatus: d.communicationStatus,
      lastResponseAt: nowIso(),
      isAddressed: d.isAddressed,
      metadata: { position: { x: 0, y: 0 } },
    }));
  }

  public static async rescanDevices(
    gatewayId: string,
    lineId: string,
    sessionId: string,
  ): Promise<DeviceState[]> {
    if (USE_MOCK) {
      await mockDelay(300);
      return [];
    }
    const res = await fetch(`${API_BASE_URL}/api/commissioning/session/${sessionId}/devices/rescan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gatewayId, lineId }),
    });
    const dtos = await handleResponse<any[]>(res);
    return dtos.map((d: any) => ({
      deviceId: d.externalId,
      shortAddress: d.shortAddress,
      connectionStatus: d.communicationStatus,
      lastResponseAt: nowIso(),
      isAddressed: d.isAddressed,
      metadata: { position: { x: 0, y: 0 } },
    }));
  }

  public static async getDevices(sessionId: string): Promise<DeviceState[]> {
    if (USE_MOCK) {
      await mockDelay(100);
      return [];
    }
    const res = await fetch(`${API_BASE_URL}/api/commissioning/session/${sessionId}/devices`);
    const dtos = await handleResponse<any[]>(res);
    return dtos.map((d: any) => ({
      deviceId: d.externalId,
      shortAddress: d.shortAddress,
      connectionStatus: d.communicationStatus,
      lastResponseAt: nowIso(),
      isAddressed: d.isAddressed,
      metadata: { position: { x: 0, y: 0 } },
    }));
  }

  public static async getDeviceState(
    deviceId: string,
    sessionId: string,
  ): Promise<DeviceState> {
    if (USE_MOCK) {
      await mockDelay(80);
      return { deviceId, address: 0, isOnline: false, level: 0, lastSeenAt: nowIso(), errorCount: 0 } as unknown as DeviceState;
    }
    throw new Error('getDeviceState endpoint not implemented on backend yet');
  }

  // ── Addressing ──────────────────────────────────────────────────

  public static async assignAddress(
    deviceExternalId: string,
    address: number,
    sessionId: string,
  ): Promise<{ deviceExternalId: string; shortAddress: number; isVerified: boolean }> {
    if (USE_MOCK) {
      await mockDelay(120);
      return { deviceExternalId, shortAddress: address, isVerified: true };
    }
    const res = await fetch(`${API_BASE_URL}/api/commissioning/session/${sessionId}/addressing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceExternalId, address }),
    });
    return handleResponse<{ deviceExternalId: string; shortAddress: number; isVerified: boolean }>(res);
  }

  public static async reprogramAddress(
    deviceExternalId: string,
    address: number,
    sessionId: string,
  ): Promise<{ deviceExternalId: string; shortAddress: number; isVerified: boolean }> {
    if (USE_MOCK) {
      await mockDelay(120);
      return { deviceExternalId, shortAddress: address, isVerified: true };
    }
    const res = await fetch(`${API_BASE_URL}/api/commissioning/session/${sessionId}/addressing/reprogram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceExternalId, address }),
    });
    return handleResponse<{ deviceExternalId: string; shortAddress: number; isVerified: boolean }>(res);
  }

  // ── Programming Deployment ──────────────────────────────────────

  public static async deployProgramming(
    plan: any,
    gatewayId: string,
    lineId: string,
    sessionId: string,
  ): Promise<{
    deploymentId: string;
    success: boolean;
    commandsSent: number;
    commandsFailed: number;
    errorMessage: string | null;
  }> {
    if (USE_MOCK) {
      await mockDelay(1500);
      return {
        deploymentId: `deploy-${Date.now()}`,
        success: true,
        commandsSent: plan.totalCommands ?? 0,
        commandsFailed: 0,
        errorMessage: null,
      };
    }
    const res = await fetch(`${API_BASE_URL}/api/commissioning/session/${sessionId}/programming/deploy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: plan.planId,
        designRevisionId: plan.designRevisionId,
        gatewayId,
        targetLineId: lineId,
        sequences: plan.sequences,
      }),
    });
    return handleResponse(res);
  }

  // ── Network state ───────────────────────────────────────────────

  public static async getNetworkState(
    gatewayId: string,
    lineId: string,
    sessionId: string,
  ): Promise<NetworkState> {
    if (USE_MOCK) {
      await mockDelay(100);
      return { gatewayId, lineId, isConnected: true, totalDevices: 0, onlineDevices: 0, errorCount: 0, lastScanAt: nowIso(), busVoltage: 16 };
    }
    const res = await fetch(`${API_BASE_URL}/api/commissioning/session/${sessionId}/network`);
    return handleResponse<NetworkState>(res);
  }

  public static async resetBus(
    gatewayId: string,
    lineId: string,
    sessionId: string,
  ): Promise<void> {
    if (USE_MOCK) {
      await mockDelay(150);
      return;
    }
    throw new Error('resetBus endpoint not implemented on backend yet');
  }

  // ── Tests ───────────────────────────────────────────────────────

  public static async testDeviceSignal(
    deviceId: string,
    sessionId: string,
  ): Promise<TestResult> {
    if (USE_MOCK) {
      await mockDelay(120);
      return { testId: `test-${Date.now()}`, deviceId, testType: 'SIGNAL', status: 'PASSED', executedAt: nowIso(), durationMs: 120, details: 'Mock signal test' } as unknown as TestResult;
    }
    throw new Error('testDeviceSignal endpoint not implemented on backend yet');
  }

  public static async testNetworkLine(
    gatewayId: string,
    lineId: string,
    sessionId: string,
  ): Promise<TestResult[]> {
    if (USE_MOCK) {
      await mockDelay(400);
      return [
        { testId: `t-${lineId}-1`, deviceId: `${lineId}-dev-001`, testType: 'NETWORK', status: 'PASSED', executedAt: nowIso(), durationMs: 12 } as unknown as TestResult,
        { testId: `t-${lineId}-2`, deviceId: `${lineId}-dev-002`, testType: 'NETWORK', status: 'PASSED', executedAt: nowIso(), durationMs: 15 } as unknown as TestResult,
        { testId: `t-${lineId}-3`, deviceId: `${lineId}-dev-003`, testType: 'NETWORK', status: 'PASSED', executedAt: nowIso(), durationMs: 11 } as unknown as TestResult,
      ];
    }
    const res = await fetch(`${API_BASE_URL}/api/commissioning/session/${sessionId}/network/tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gatewayId, lineId }),
    });
    const dto = await handleResponse<any>(res);
    const status = dto.isConnected ? 'PASSED' : 'FAILED';
    return [{
      testId: `t-${lineId}-net-${Date.now()}`,
      deviceId: lineId,
      testType: 'NETWORK',
      status,
      executedAt: nowIso(),
      durationMs: 12,
    } as unknown as TestResult];
  }

  // ── Faults ──────────────────────────────────────────────────────

  public static async getActiveFaults(sessionId: string): Promise<Fault[]> {
    if (USE_MOCK) {
      await mockDelay(80);
      return [];
    }
    const res = await fetch(`${API_BASE_URL}/api/commissioning/session/${sessionId}/faults`);
    return handleResponse<Fault[]>(res);
  }

  public static async resolveFault(
    faultId: string,
    notes: string,
    sessionId: string,
  ): Promise<Fault> {
    if (USE_MOCK) {
      await mockDelay(100);
      return { faultId, resolvedAt: nowIso(), resolvedBy: 'current-user', notes } as unknown as Fault;
    }
    const res = await fetch(`${API_BASE_URL}/api/commissioning/faults/${faultId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, defectId: faultId, resolvedBy: 'current-user', notes }),
    });
    return handleResponse<Fault>(res);
  }

  // ── Scenes ──────────────────────────────────────────────────────

  public static async executeSceneTest(
    sceneId: string,
    sessionId: string,
  ): Promise<SceneTest> {
    if (USE_MOCK) {
      await mockDelay(250);
      return { sceneId, status: 'PASSED', executedAt: nowIso(), deviceResults: [] } as unknown as SceneTest;
    }
    const res = await fetch(`${API_BASE_URL}/api/commissioning/session/${sessionId}/scenes/tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sceneIds: [sceneId] }),
    });
    const dtos = await handleResponse<any[]>(res);
    const dto = dtos[0];
    return {
      sceneId,
      status: dto?.status ?? 'PASSED',
      executedAt: dto?.executedAt ?? nowIso(),
      deviceResults: [],
    } as unknown as SceneTest;
  }

  // ── Signals ─────────────────────────────────────────────────────

  public static async getSignalLogs(
    deviceId: string,
    sessionId: string,
  ): Promise<SignalLog[]> {
    if (USE_MOCK) {
      await mockDelay(80);
      return [];
    }
    const res = await fetch(`${API_BASE_URL}/api/commissioning/session/${sessionId}/signals`);
    return handleResponse<SignalLog[]>(res);
  }
}