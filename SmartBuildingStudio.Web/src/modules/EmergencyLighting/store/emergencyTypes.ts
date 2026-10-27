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
  };
}