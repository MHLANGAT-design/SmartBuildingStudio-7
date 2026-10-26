import { ExplorerHistory } from "@/modules/ProjectExplorer/Document/ExplorerHistory";

/**
 * Orchestrator service routing multi-studio page transactions and folder transitions.
 */
export class NavigationManager {
  private readonly history: ExplorerHistory;
  private readonly onNodeSelectedCallback: (nodeId: string | null) => void;

  constructor(onNodeSelected: (nodeId: string | null) => void) {
    this.history = new ExplorerHistory();
    this.onNodeSelectedCallback = onNodeSelected;
  }

  /**
   * Commands the workspace browser view panel to target a specific folder or file node.
   */
  public navigateToNode(nodeId: string | null): void {
    if (nodeId) {
      this.history.push(nodeId);
    }
    this.onNodeSelectedCallback(nodeId);
  }

  /**
   * Executes back step procedures mapping across directory trails.
   */
  public navigateBack(): void {
    if (this.history.canGoBack()) {
      const previousNodeId = this.history.goBack();
      this.onNodeSelectedCallback(previousNodeId);
    }
  }

  /**
   * Executes forward step procedures mapping across directory trails.
   */
  public navigateForward(): void {
    if (this.history.canGoForward()) {
      const nextNodeId = this.history.goForward();
      this.onNodeSelectedCallback(nextNodeId);
    }
  }

  public getHistoryEngine(): ExplorerHistory {
    return this.history;
  }
}
