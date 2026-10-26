import { Project, ExplorerNode } from '@/modules/ProjectExplorer/Models';

export class ProjectTreeBuilder {
  /**
   * Transforms raw relational project tracking models into structured tree nodes
   */
  public static buildTreeFromProjects(projects: Project[]): ExplorerNode[] {
    if (!projects || projects.length === 0) return [];

    return projects.map((project) => {
      const childrenIds = project.buildings?.map((b) => b.id) || [];
      
      return {
        id: project.id,
        name: project.name,
        type: 'Project',
        parentId: null,
        childrenIds,
        validationErrorCount: 0,
      };
    });
  }

  /**
   * Resolves structural children arrays safely based on parent context properties
   */
  public static resolveChildNodes(parentNode: ExplorerNode, dataset: Project[]): ExplorerNode[] {
    if (!parentNode || !dataset) return [];

    switch (parentNode.type) {
      case 'Project': {
        const match = dataset.find((p) => p.id === parentNode.id);
        return match?.buildings.map((b) => ({
          id: b.id,
          name: b.name,
          type: 'Building',
          parentId: parentNode.id,
          childrenIds: b.floors?.map((f) => f.id) || [],
          validationErrorCount: 0,
        })) || [];
      }

      case 'Building': {
        for (const p of dataset) {
          const match = p.buildings.find((b) => b.id === parentNode.id);
          if (match) {
            return match.floors.map((f) => ({
              id: f.id,
              name: f.name,
              type: 'Floor',
              parentId: parentNode.id,
              childrenIds: f.documents?.map((d) => d.id) || [],
              validationErrorCount: 0,
            }));
          }
        }
        break;
      }

      case 'Floor': {
        for (const p of dataset) {
          for (const b of p.buildings) {
            const match = b.floors.find((f) => f.id === parentNode.id);
            if (match) {
              return match.documents.map((d) => ({
                id: d.id,
                name: d.name,
                type: 'Document',
                parentId: parentNode.id,
                childrenIds: [],
                documentType: d.documentType,
                routePath: d.routePath,
                isLocked: d.isLocked,
                validationErrorCount: 0,
              }));
            }
          }
        }
        break;
      }

      default:
        return [];
    }

    return [];
  }
}
