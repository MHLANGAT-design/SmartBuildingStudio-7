// src/modules/Commissioning/store/commissioningTypes.ts

import type { CommissioningSession } from '@/modules/Commissioning/models/CommissioningSession';
import type { CommissioningReport } from '@/modules/Commissioning/models/CommissioningReport';
import type { TestResult } from '@/modules/Commissioning/models/TestResult';
import type { CommissioningFloorplanRenderModel } from '@/modules/Commissioning/Document/CommissioningFloorplanLoader';

export type CommissioningInspectorSelection =
  | { kind: 'device'; id: string }
  | { kind: 'network'; id: string }
  | { kind: 'fault'; data: any }
  | { kind: 'sceneTest'; data: any }
  | { kind: 'testResult'; data: any }
  | null;

export interface CommissioningState {
  activeSession: CommissioningSession | null;
  recentTestResults: TestResult[];
  finalReport: CommissioningReport | null;
  isDiscovering: boolean;
  isAddressing: boolean;
  isTesting: boolean;
  isGeneratingReport: boolean;
  error: string | null;
  floorplanId: string | null;
  floorplan: CommissioningFloorplanRenderModel | null;
  floorplanLoading: boolean;
  floorplanError: string | null;
  viewport: { offsetX: number; offsetY: number; zoom: number };
  layerVisibility: Record<string, boolean>;
  
  inspectorSelection: CommissioningInspectorSelection;
}