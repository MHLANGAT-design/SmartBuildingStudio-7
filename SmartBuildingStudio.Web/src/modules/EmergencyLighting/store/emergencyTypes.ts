// src/modules/EmergencyLighting/store/emergencyTypes.ts

import { EvacuationRoute } from '@/modules/EmergencyLighting/models/EvacuationRoute';
import type { PhotometricData } from '@/modules/FixturePlacementStudio/models/PhotometricData';

export interface ComplianceIssue {
  id: string;
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  location: { x: number; y: number };
  fixtureId?: string;
}

export interface EmergencyDocument {
  id: string;
  projectId: string;
  floorplanId: string;
  name: string;
  revision: number;
  updatedAt: string;
  exitRoutes: EvacuationRoute[];
  complianceIssues: ComplianceIssue[];
  lastRunAt: string | null;
  simulationStatus: 'idle' | 'running' | 'complete' | 'error';
}

export interface EmergencyState {
  floorplan: {
    model: any | null;
    status: 'idle' | 'loading' | 'ready' | 'error';
    error: string | null;
  };
  rawGeometry: {
    elements: any[];
    status: 'idle' | 'loading' | 'ready' | 'error';
  };
  simulation: {
    issues: ComplianceIssue[];
    status: 'idle' | 'running' | 'complete' | 'error';
    error: string | null;
    lastRunAt: string | null;
  };
  heatmap: {
    data: PhotometricData | null;
    status: 'idle' | 'running' | 'complete' | 'error';
    error: string | null;
    lastRunAt: string | null;
  };
  routesSave: {
    status: 'idle' | 'saving' | 'saved' | 'error';
    error: string | null;
    lastSavedAt: string | null;
  };
  routes: EvacuationRoute[];
  routeDrawing: {
    isDrawing: boolean;
    startPoint: { x: number; y: number } | null;
    cursorPoint: { x: number; y: number } | null;
    pendingPoints: Array<{ x: number; y: number }>;
  };
  viewport: { zoom: number; offsetX: number; offsetY: number };
  layerVisibility: {
    heatmap: boolean;
    visibilityCones: boolean;
    coverageZones: boolean;
    exitRoutes: boolean;
    exitSigns: boolean;
    rawgeometry: boolean;
  };
  ui: {
    activePanel: 'simulation' | 'compliance' | 'routes';
    isSimulationDialogOpen: boolean;
    isReportDialogOpen: boolean;
    selectedRouteId: string | null;
  };
}