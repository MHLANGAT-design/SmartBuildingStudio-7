import { DocumentTypeContract } from '@/modules/ProjectExplorer/Models/ProjectDocument';

export type ExplorerNodeType = 'Project' | 'Building' | 'Floor' | 'Folder' | 'Document';

export interface ExplorerNode {
  id: string;
  name: string;
  type: ExplorerNodeType;
  parentId: string | null;
  childrenIds: string[];
  documentType?: DocumentTypeContract;
  routePath?: string;
  isLocked?: boolean;
  validationErrorCount: number;
}
