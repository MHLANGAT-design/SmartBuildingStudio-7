import { ExplorerNode } from '@/modules/ProjectExplorer/Models';

export class ExplorerSorting {
  /**
   * Enforces alphabetical order rules on text strings
   */
  public static sortAlphaNumeric(nodes: ExplorerNode[]): ExplorerNode[] {
    if (!nodes) return [];
    return [...nodes].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  }

  /**
   * Forces system components into grouped type priority categories
   */
  public static sortByTypePriority(nodes: ExplorerNode[]): ExplorerNode[] {
    if (!nodes) return [];
    
    const typeWeights: Record<string, number> = {
      Project: 1,
      Building: 2,
      Floor: 3,
      Folder: 4,
      Document: 5,
    };

    return [...nodes].sort((a, b) => {
      const weightA = typeWeights[a.type] || 99;
      const weightB = typeWeights[b.type] || 99;
      
      if (weightA !== weightB) {
        return weightA - weightB;
      }
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    });
  }
}
