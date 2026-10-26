import { ExplorerNode, ProjectDocumentType } from "@/modules/ProjectExplorer/Store/ProjectExplorerTypes";

/**
 * Orchestrates cross-studio session launching across the Smart Building Studio platform.
 */
export class DocumentLauncher {
  /**
   * Resolves the target studio endpoint route and initializes the canvas workspace session.
   * 
   * @param node The highlighted ExplorerNode file object to execute.
   * @throws Error if the target element context cannot be resolved.
   */
  public static launch(node: ExplorerNode): string {
    if (node.type !== "Document") {
      throw new Error(`Execution Conflict: Cannot launch a target node container of type '${node.type}'.`);
    }

    const documentType = node.documentType;
    console.log(`[DocumentLauncher Core] Evaluating compilation signatures for document GUID: ${node.id}`);

    // Route structural mapping matrix matching specialized platform sub-studios
    switch (documentType) {
      case "ReflectedCeiling":
      case "LightingBase":
        return `/designer/floorplan?documentId=${node.id}&parentId=${node.parentId}`;
        
      case "FixtureLayout":
        return `/designer/fixtures?documentId=${node.id}&parentId=${node.parentId}`;
        
      case "DaliNetwork":
        return `/designer/dali?documentId=${node.id}&parentId=${node.parentId}`;
        
      case "EmergencyLighting":
        return `/designer/emergency?documentId=${node.id}&parentId=${node.parentId}`;
        
      case "ValidationReport":
        return `/reports/compliance?reportId=${node.id}`;
        
      case "AssetInventory":
        return `/reports/inventory?projectId=${node.parentId}`;
        
      default:
        // Safe backward-compatible fallback boundary route path
        return `/designer/floorplan?documentId=${node.id}`;
    }
  }

  /**
   * Asserts whether an engineering designer session path is locked under edit by another network operator.
   */
  public static canLaunch(node: ExplorerNode): boolean {
    return node.type === "Document" && !node.isLocked;
  }
}