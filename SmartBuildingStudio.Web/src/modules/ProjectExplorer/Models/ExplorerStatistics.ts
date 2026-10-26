export interface ExplorerStatistics {
  targetId: string; // Resolves to ProjectId, BuildingId, or FloorId
  buildingCount: number;
  floorCount: number;
  totalDrawingsCount: number;
  floorPlansCount: number;
  fixtureLayoutsCount: number;
  daliNetworksCount: number;
  emergencyReportsCount: number;
  validationErrorsCount: number;
  lastModifiedTimestamp: string;
}
