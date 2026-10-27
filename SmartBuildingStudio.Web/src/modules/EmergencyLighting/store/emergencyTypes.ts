// src/modules/EmergencyLighting/store/emergencyTypes.ts

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