import { ProjectDocument } from '@/modules/ProjectExplorer/Models/ProjectDocument';

export interface Floor {
  id: string;
  buildingId: string;
  name: string;
  levelNumber: number;
  elevationMeters: number;
  floorAreaSqMeters: number;
  documents: ProjectDocument[];
  lastModifiedTimestamp: string;
}
