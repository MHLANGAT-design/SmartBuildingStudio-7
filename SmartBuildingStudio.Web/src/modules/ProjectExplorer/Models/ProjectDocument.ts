export enum DocumentTypeContract {
  FloorPlan = 0,
  FixtureLayout = 1,
  DaliNetwork = 2,
  EmergencyLighting = 3,
  Report = 4
}

export interface ProjectDocument {
  id: string;
  name: string;
  documentType: DocumentTypeContract;
  routePath: string;
  version: number;
  lastModifiedBy: string;
  lastModifiedTimestamp: string;
  fileSizeInBytes: number;
  isLocked: boolean;
  lockedByUsername?: string;
}
