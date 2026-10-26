// src/modules/FloorPlanDesigner/Commands/DeleteWallsCommand.ts
import { ICommand } from "@/modules/FloorPlanDesigner/Commands/ICommand";
import { DrawingDocument } from "@/modules/FloorPlanDesigner/Document/DrawingDocument";

export interface DeleteWallsCommandOptions {
  document: DrawingDocument;
  wallIds: string[];
}

export class DeleteWallsCommand implements ICommand {
  private readonly id: string;
  private readonly document: DrawingDocument;
  private readonly wallIds: string[];
  private removedWalls: any[] = [];
  private removedElements: any[] = [];
  private executed = false;

  constructor(options: DeleteWallsCommandOptions) {
    this.id = `cmd_${Date.now()}_${Math.random()}`;
    this.document = options.document;
    this.wallIds = options.wallIds;
  }

  public getId(): string { return this.id; }
  public getDescription(): string { return "Delete Walls"; }
  public isExecuted(): boolean { return this.executed; }

  public execute(): void {
    if (this.executed) return;

    this.removedWalls = [];
    this.removedElements = [];

    // Cast to any — see DeleteDoorsCommand for rationale.
    const doc: any = this.document;

    for (const id of this.wallIds) {
      let wall: any = null;

      // Search in elements array first
      if (doc.elements && Array.isArray(doc.elements)) {
        const index = doc.elements.findIndex(
          (el: any) =>
            (el.id === id || el.Id === id) &&
            (String(el.type || '').toLowerCase() === 'wall' ||
              String(el.type || '').toLowerCase() === 'walls')
        );
        if (index !== -1) {
          wall = doc.elements[index];
          this.removedElements.push({ element: wall, index });
          doc.elements.splice(index, 1);
        }
      }

      // Also search in walls array if it exists
      if (doc.walls && Array.isArray(doc.walls)) {
        const wallInWalls = doc.walls.find((w: any) => w.id === id || w.Id === id);
        if (wallInWalls) {
          if (!wall) wall = wallInWalls;
          this.removedWalls.push(wallInWalls);
          doc.walls = doc.walls.filter((w: any) => w.id !== id && w.Id !== id);
        }
      }

      if (typeof doc.findWall === 'function') {
        const foundWall = doc.findWall(id);
        if (foundWall && !wall) wall = foundWall;
      }

      if (typeof doc.removeWall === 'function') {
        doc.removeWall(id);
      }
    }

    this.executed = true;

    if (typeof window !== 'undefined') {
      const win = window as any;
      if (win.__floorPlanActiveDocumentInstance) {
        win.__floorPlanActiveDocumentInstance = { ...doc };
      }
      if (win.__floorPlanDispatch) {
        win.__floorPlanDispatch({
          type: "floorPlan/setDocument",
          payload: { ...doc },
        });
        win.__floorPlanDispatch({ type: "floorPlan/markDirty" });
      }
      window.dispatchEvent(new CustomEvent('sbs:canvas-update'));
      window.dispatchEvent(new CustomEvent('canvas-invalidate'));
    }
  }

  public undo(): void {
    if (!this.executed) return;

    const doc: any = this.document;

    for (const item of this.removedElements) {
      if (doc.elements && Array.isArray(doc.elements)) {
        doc.elements.splice(item.index, 0, item.element);
      }
    }

    for (const wall of this.removedWalls) {
      if (typeof doc.addWall === 'function') {
        doc.addWall(wall);
      }
      if (doc.walls && Array.isArray(doc.walls)) {
        doc.walls.push(wall);
      }
    }

    this.executed = false;

    if (typeof window !== 'undefined') {
      const win = window as any;
      if (win.__floorPlanDispatch) {
        win.__floorPlanDispatch({
          type: "floorPlan/setDocument",
          payload: { ...doc },
        });
      }
      window.dispatchEvent(new CustomEvent('sbs:canvas-update'));
      window.dispatchEvent(new CustomEvent('canvas-invalidate'));
    }
  }

  public redo(): void {
    this.execute();
  }
}