import { ExplorerNodeType } from '@/modules/ProjectExplorer/Models/ExplorerNode';
import { DocumentTypeContract } from '@/modules/ProjectExplorer/Models/ProjectDocument';

export class ExplorerIcons {
  /**
   * Resolves component design templates directly to physical functional character indicators
   */
  public static getIconByNodeType(type: ExplorerNodeType, documentType?: DocumentTypeContract): string {
    switch (type) {
      case 'Project':
        return '🏢';
      case 'Building':
        return '🏬';
      case 'Floor':
        return '🥞';
      case 'Folder':
        return '📁';
      case 'Document':
        return this.resolveDocumentTypeIcon(documentType);
      default:
        return '📄';
    }
  }

  /**
   * Maps engineering configuration properties directly to distinct layout graphic definitions
   */
  private static resolveDocumentTypeIcon(docType?: DocumentTypeContract): string {
    if (docType === undefined) return '📄';

    switch (docType) {
      case DocumentTypeContract.FloorPlan:
        return '📐';
      case DocumentTypeContract.FixtureLayout:
        return '💡';
      case DocumentTypeContract.DaliNetwork:
        return '🔌';
      case DocumentTypeContract.EmergencyLighting:
        return '🚨';
      case DocumentTypeContract.Report:
        return '📊';
      default:
        return '📄';
    }
  }
}
