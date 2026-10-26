/**
 * Linear history context stack tracking workspace folder node selections.
 */
export class ExplorerHistory {
  private backStack: string[] = [];
  private forwardStack: string[] = [];
  private currentId: string | null = null;
  private readonly maxStackDepth = 50;

  /**
   * Records a new node tracking point and flushes the forward cache trail.
   */
  public push(nodeId: string): void {
    if (this.currentId === nodeId) return;

    if (this.currentId !== null) {
      this.backStack.push(this.currentId);
      // Evict oldest history trail points if the depth crosses safety thresholds
      if (this.backStack.length > this.maxStackDepth) {
        this.backStack.shift();
      }
    }

    this.currentId = nodeId;
    this.forwardStack = []; // Flushes forward historical path parameters on new selection paths
  }

  public canGoBack(): boolean {
    return this.backStack.length > 0;
  }

  public canGoForward(): boolean {
    return this.forwardStack.length > 0;
  }

  /**
   * Steps backward down the browser exploration trail array.
   */
  public goBack(): string | null {
    if (!this.canGoBack()) return null;

    if (this.currentId !== null) {
      this.forwardStack.push(this.currentId);
    }

    this.currentId = this.backStack.pop() ?? null;
    return this.currentId;
  }

  /**
   * Re-steps forward down the historical browsing trail array.
   */
  public goForward(): string | null {
    if (!this.canGoForward()) return null;

    if (this.currentId !== null) {
      this.backStack.push(this.currentId);
    }

    this.currentId = this.forwardStack.pop() ?? null;
    return this.currentId;
  }

  public clear(): void {
    this.backStack = [];
    this.forwardStack = [];
    this.currentId = null;
  }
}
