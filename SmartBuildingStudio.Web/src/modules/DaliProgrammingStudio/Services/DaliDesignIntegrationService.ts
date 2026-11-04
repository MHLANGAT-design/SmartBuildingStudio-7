// src/modules/DaliProgrammingStudio/Services/DaliDesignIntegrationService.ts

import type { ApprovedDaliDesign } from '@/modules/DaliProgrammingStudio/types/dali.types';
import type { DaliDeviceDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';
import type { DaliDeviceRole, DaliDeviceType } from '@/modules/DaliProgrammingStudio/constants/daliDeviceTypes';

interface DaliDeviceRaw {
  id: string;
  sourceFixtureId: string;
  kind: 'Ballast' | 'Sensor' | 'Switch';
  label: string;
  lineId: string | null;
  address: number | null;
  groupIds: string[];
  metadata: {
    luminaireType?: string;
    wattage?: number;
    position?: { x: number; y: number };
    productId?: string;
    roomId?: string;
    roomName?: string;
    sourceKind?: string;
  };
}

interface DaliLineRaw {
  id: string;
  name: string;
  maxDevices: number;
  powerBudgetW: number;
}

interface GroupRaw {
  id: string;
  name: string;
  color?: string;
}

interface SceneRaw {
  id: string;
  name: string;
  levels: Record<string, number>;
  fadeTime?: number;
}

interface DaliDocumentRaw {
  projectId?: string;
  documentId?: string;
  floorplanId?: string;   // ← ADDED
  devices: DaliDeviceRaw[];
  lines: DaliLineRaw[];
  groups: GroupRaw[];
  scenes: SceneRaw[];
}

export class DaliDesignIntegrationService {
  /**
   * Fetches the approved DALI design from the `dali` Redux slice.
   * Reads directly from the store, no API call, no mock.
   */
  public fetchApprovedDesign(state: any): ApprovedDaliDesign {
    const daliState = state?.dali;
    
    if (!daliState || !daliState.document) {
      throw new Error('DaliDesigner document is not loaded. Open a DALI design first.');
    }

    const doc: DaliDocumentRaw = daliState.document;
    const now = new Date().toISOString();
    const projectId = doc.projectId || doc.documentId || 'unknown-project';
    const floorplanId = doc.floorplanId || doc.documentId || 'unknown-floorplan';   // ← ADDED

    // ── Map lines ────────────────────────────────────────────────
    const lines = (doc.lines || []).map((line) => ({
      lineId: line.id,
      name: line.name,
      gatewayId: 'default-gateway',
      deviceCount: (doc.devices || []).filter(d => d.lineId === line.id).length,
      maxDevices: line.maxDevices || 64,
    }));

    // ── Map groups (convert string IDs to numeric DALI group IDs) ─
    const groupIdMap = new Map<string, number>();
    const groups = (doc.groups || []).slice(0, 16).map((g, index) => {
      groupIdMap.set(g.id, index);
      return {
        groupId: index,
        lineId: lines[0]?.lineId || 'unknown-line',
        name: g.name,
      };
    });

    // ── Map scenes ───────────────────────────────────────────────
    const sceneIdMap = new Map<string, number>();
    const scenes = (doc.scenes || []).slice(0, 16).map((s, index) => {
      sceneIdMap.set(s.id, index);
      return {
        sceneId: index,
        lineId: lines[0]?.lineId || 'unknown-line',
        name: s.name,
      };
    });

    // ── Map devices ──────────────────────────────────────────────
    const devices: DaliDeviceDefinition[] = (doc.devices || []).map((dev) => {
      const lineId = dev.lineId || lines[0]?.lineId || 'unknown-line';

      // Pass the address through exactly as it is.
      // If it's null, we use -1 to signal "unassigned" to the validator.
      // Safety Rule: We NEVER auto-assign addresses in the mapper. 
      // The design must be fully addressed in DaliDesigner.
      let address = dev.address;
      if (address === null || address === undefined) {
        address = -1;
      }

      // Map kind → role + deviceType
      let role: DaliDeviceRole = 'CONTROL_GEAR';
      let deviceType: DaliDeviceType = 6; // LED Module default

      if (dev.kind === 'Sensor') {
        role = 'CONTROL_DEVICE';
        deviceType = 11; // Occupancy Sensor
      } else if (dev.kind === 'Switch') {
        role = 'CONTROL_DEVICE';
        deviceType = 10; // Push Button
      } else {
        role = 'CONTROL_GEAR';
        if (dev.metadata.sourceKind === 'emergencyLight') {
          deviceType = 1; // Emergency Lighting
        } else {
          deviceType = 6; // LED Module
        }
      }

      // Map groups → numeric IDs
      const deviceGroups = (dev.groupIds || [])
        .map((gId) => {
          const numId = groupIdMap.get(gId);
          if (numId === undefined) return null;
          const group = groups.find(g => g.groupId === numId);
          return group ? { groupId: numId, name: group.name } : null;
        })
        .filter((g): g is { groupId: number; name: string } => g !== null);

      // Map scenes → per-device scene assignments
      const deviceScenes = (doc.scenes || [])
        .map((s) => {
          const sceneNumId = sceneIdMap.get(s.id);
          if (sceneNumId === undefined) return null;
          const level = s.levels?.[dev.id];
          if (level === undefined) return null;
          return { sceneId: sceneNumId, level };
        })
        .filter((s): s is { sceneId: number; level: number } => s !== null);

      return {
        deviceId: dev.id,
        lineId,
        hardwareAddress: address,
        logicalName: dev.label,
        role,
        deviceType,
        d4iTypes: [],
        groups: deviceGroups,
        scenes: deviceScenes,
        parameters: {
          minLevel: 1,
          maxLevel: 254,
          powerOnLevel: 254,
          systemFailureLevel: 0,
          fadeTime: 0,
          fadeRate: 0,
        },
        fixtureInstanceId: dev.sourceFixtureId,
      };
    });

    return {
      topology: {
        projectId,
        floorplanId,   // ← ADDED
        gateways: [{
          gatewayId: 'default-gateway',
          name: 'Main Gateway',
          manufacturer: 'SmartBuildingStudio',
          protocol: 'DALI-2',
          status: 'ONLINE',
        }],
        lines,
        lastUpdated: now,
      },
      devices,
      groups,
      scenes,
      revisionId: `rev_${Date.now()}`,
      approvedBy: 'current-user',
      approvedAt: now,
    };
  }
}