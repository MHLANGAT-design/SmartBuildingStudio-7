// UseDocumentLauncher.ts
// COMPLETE FILE - Replace everything

import { useCallback } from "react";
import { ExplorerNode } from "@/modules/ProjectExplorer/Store/ProjectExplorerTypes";
import { DocumentLauncher } from "@/modules/ProjectExplorer/Document/DocumentLauncher";

export function UseDocumentLauncher() {
  
  /**
   * Evaluates edit locks and executes standalone drawing sessions across engineering studios.
   */
  const launchDocumentSession = useCallback((node: ExplorerNode) => {
    if (!DocumentLauncher.canLaunch(node)) {
      console.warn(`[Document Launcher Interface] Target asset document reference '${node.id}' is locked under editing constraints.`);
      return { success: false, route: null, reason: "Asset Locked" };
    }

    try {
      const targetRoutePath = DocumentLauncher.launch(node);
      console.log(`[Document Launcher Interface] Context matching routing pathway compiled: ${targetRoutePath}`);
      
      // Execute window location change or router push triggers cleanly right here
      window.location.hash = targetRoutePath; 
      return { success: true, route: targetRoutePath, reason: null };
    } catch (error: any) {
      console.error("[Document Launcher Interface] Critical session initiation crash:", error);
      return { success: false, route: null, reason: error.message };
    }
  }, []);

  return {
    launchDocumentSession
  };
}