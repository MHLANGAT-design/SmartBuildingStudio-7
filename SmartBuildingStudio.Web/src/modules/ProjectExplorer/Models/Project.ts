import { Building } from '@/modules/ProjectExplorer/Models/Building';

export interface Project {
  id: string;
  name: string;
  description: string;
  clientName: string;
  projectNumber: string;
  buildings: Building[];
  isArchived: boolean;
  createdTimestamp: string;
  lastModifiedTimestamp: string;
}
