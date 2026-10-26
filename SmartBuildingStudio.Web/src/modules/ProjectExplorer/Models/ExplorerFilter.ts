import { DocumentTypeContract } from '@/modules/ProjectExplorer/Models/ProjectDocument';

export type SystemValidationStatusFilter = 'All' | 'Clean' | 'WithErrors' | 'Locked';

export interface ExplorerFilter {
  documentTypes: DocumentTypeContract[];
  status: SystemValidationStatusFilter;
  modifiedSince?: string;
  assignedEngineerId?: string;
}
