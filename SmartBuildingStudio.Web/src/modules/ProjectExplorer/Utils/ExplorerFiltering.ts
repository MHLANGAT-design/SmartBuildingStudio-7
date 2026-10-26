import { ExplorerNode, ExplorerFilter } from '@/modules/ProjectExplorer/Models';

export class ExplorerFiltering {
  /**
   * Evaluates text criteria matching bounds against node structures
   */
  public static matchesSearchQuery(node: ExplorerNode, query: string): boolean {
    if (!query) return true;
    const normalizedQuery = query.toLowerCase().trim();
    return node.name.toLowerCase().includes(normalizedQuery);
  }

  /**
   * Applies metadata criteria filters to narrow structural scope elements
   */
  public static passesFilterConstraints(node: ExplorerNode, filter: ExplorerFilter): boolean {
    if (!filter) return true;

    // Status condition checks
    if (filter.status === 'Locked' && node.type === 'Document' && !node.isLocked) {
      return false;
    }

    // Document type constraint checks
    if (node.type === 'Document' && node.documentType !== undefined) {
      if (filter.documentTypes.length > 0 && !filter.documentTypes.includes(node.documentType)) {
        return false;
      }
    }

    return true;
  }
}
