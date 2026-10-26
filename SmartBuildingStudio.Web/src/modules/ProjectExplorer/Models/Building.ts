import { Floor } from '@/modules/ProjectExplorer/Models/Floor';

export interface Building {
  id: string;
  projectId: string;
  name: string;
  code: string;
  address?: string;
  floors: Floor[];
  lastModifiedTimestamp: string;
}
