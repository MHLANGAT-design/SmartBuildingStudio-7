// src/modules/FloorPlanDesigner/Commands/AddWallCommand.ts
import { ICommand } from "@/modules/FloorPlanDesigner/Commands/ICommand";
import { store } from "@/Application/ConfigureStore";

export class AddWallCommand implements ICommand {
  private readonly id: string;
  private readonly wallId: string;
  private readonly wallData: any;
  private readonly contextContainer: any;
  private previouslyActiveSelection: any | null = null;
  private executed = false;

  constructor(wallId: string, wallData: any, contextContainer: any) {
    this.id = `cmd_add_wall_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.wallId = wallId;
    this.wallData = wallData;
    this.contextContainer = contextContainer;
  }

  public getId(): string { return this.id; }
  public getDescription(): string { return `Add Wall (${this.wallId})`; }
  public isExecuted(): boolean { return this.executed; }

  public execute(): void {
    if (this.executed) return;

    console.log(`[AddWallCommand] Registering structural wall boundary allocation: ${this.wallId}`);

    const currentGlobalState = store.getState().floorPlan || (store.getState() as any).FloorPlan;
    this.previouslyActiveSelection = currentGlobalState?.selection || null;

    const targetDoc = this.contextContainer?.document ||
      this.contextContainer?.drawingDocument || (this.contextContainer as any).getDocument?.();
    if (targetDoc && typeof targetDoc.addWall === "function") {
      targetDoc.addWall(this.wallData);
    }

    if (this.contextContainer?.activeLayout) {
      if (!this.contextContainer.activeLayout.walls) {
        this.contextContainer.activeLayout.walls = new Map();
      }
      this.contextContainer.activeLayout.walls.set(this.wallId, this.wallData);
    }

    if ((window as any).__floorPlanActiveDocumentInstance) {
      const activeGlobalPool = (window as any).__floorPlanActiveDocumentInstance.customDrawnWalls || [];
      if (!activeGlobalPool.some((w: any) => w.id === this.wallId)) {
        activeGlobalPool.push(this.wallData);
      }
      (window as any).__floorPlanActiveDocumentInstance.customDrawnWalls = activeGlobalPool;
      (window as any).__floorPlanActiveDocumentInstance.walls = [...activeGlobalPool];
    }

    this.executed = true;
  }

  public undo(): void {
    if (!this.executed) return;

    console.log(`[AddWallCommand] Rolling back wall layout entries: ${this.wallId}`);

    // DrawingDocument does not declare `removeWall`, but a concrete
    // implementation may provide it. Cast to `any` for the guarded call.
    const doc: any = this.contextContainer?.document ||
      this.contextContainer?.drawingDocument || (this.contextContainer as any).getDocument?.();
    if (doc && typeof doc.removeWall === "function") {
      doc.removeWall(this.wallId);
    }

    if (this.contextContainer?.activeLayout?.walls) {
      this.contextContainer.activeLayout.walls.delete(this.wallId);
    }

    const existingWalls = (window as any).__floorPlanActiveDocumentInstance?.customDrawnWalls || [];
    const filteredWallsPool = existingWalls.filter((w: any) => w.id !== this.wallId);

    if ((window as any).__floorPlanActiveDocumentInstance) {
      (window as any).__floorPlanActiveDocumentInstance.customDrawnWalls = filteredWallsPool;
      (window as any).__floorPlanActiveDocumentInstance.walls = filteredWallsPool;
    }

    store.dispatch({ type: "floorPlan/syncDocumentState" });
    store.dispatch({ type: "floorPlan/setSelection", payload: this.previouslyActiveSelection });

    window.dispatchEvent(new CustomEvent("sbs:canvas-update"));
    window.dispatchEvent(new CustomEvent("canvas-invalidate"));
    this.executed = false;
  }

  public redo(): void {
    this.execute();
  }
}

export default AddWallCommand;