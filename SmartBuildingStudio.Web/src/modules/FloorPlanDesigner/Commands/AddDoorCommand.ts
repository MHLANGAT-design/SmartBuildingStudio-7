import { ICommand } from "@/modules/FloorPlanDesigner/Commands/ICommand";
import { DrawingDocument } from "@/modules/FloorPlanDesigner/Document/DrawingDocument";
import { DoorData } from "@/modules/FloorPlanDesigner/core/types/Door.types"; // Importing standard domain type
import { store } from "@/Application/ConfigureStore";

export interface AddDoorCommandOptions {
  document: DrawingDocument;
  door: DoorData;
}

export class AddDoorCommand implements ICommand {
  private readonly id: string;
  private readonly document: DrawingDocument;
  private readonly door: DoorData;
  private executed = false;
  private previouslyActiveSelection: any | null = null;

  constructor(options: AddDoorCommandOptions) {
    this.id = `cmd_${Date.now()}_${Math.random()}`;
    this.document = options.document;

    // Normalize and enforce DoorData defaults in accordance with Door.types.ts
    //
    // NOTE: `style` in DoorData is optional. We pass through whatever the
    // caller supplied — no `{}` fallback, which would not satisfy the
    // required `strokeColor`, `strokeWidth`, and `opacity` fields.
    this.door = {
      id: options.door.id || `door_${Date.now()}`,
      type: "Door",
      wallId: options.door.wallId || "dwg-wall-root",
      hingeX: options.door.hingeX ?? 0,
      hingeY: options.door.hingeY ?? 0,
      wallAngle: options.door.wallAngle ?? 0,
      width: options.door.width ?? 900,
      height: options.door.height ?? 2100,
      isOutward: Boolean(options.door.isOutward),
      isLeftHand: Boolean(options.door.isLeftHand),
      name: options.door.name || options.door.id,
      properties: options.door.properties || {},
      style: options.door.style,
    };
  }

  public getId(): string {
    return this.id;
  }

  public getDescription(): string {
    return "Add Door";
  }

  public isExecuted(): boolean {
    return this.executed;
  }

  public execute(): void {
    if (this.executed) return;

    const currentGlobalState = store.getState().floorPlan || (store.getState() as any).FloorPlan;
    this.previouslyActiveSelection = currentGlobalState?.selection || null;

    // Direct addition to DrawingDocument utilizing standardized DoorData
    if (this.document && typeof this.document.addDoor === "function") {
      this.document.addDoor(this.door);
    }

    // Sync active document global caches using aligned DoorData instance
    if ((window as any).__floorPlanActiveDocumentInstance) {
      const activeGlobalPool: DoorData[] = (window as any).__floorPlanActiveDocumentInstance.customDrawnDoors || [];
      if (!activeGlobalPool.some((d) => d.id === this.door.id)) {
        activeGlobalPool.push(this.door);
      }
      (window as any).__floorPlanActiveDocumentInstance.customDrawnDoors = activeGlobalPool;
      (window as any).__floorPlanActiveDocumentInstance.doors = [...activeGlobalPool];
    }

    this.executed = true;
  }

  public undo(): void {
    if (!this.executed) return;

    // DrawingDocument does not declare `removeDoor`, but a concrete
    // implementation may provide it. Cast to `any` for the guarded call
    // so TypeScript accepts it without weakening the property's typed
    // declaration elsewhere.
    const doc: any = this.document;
    if (doc && typeof doc.removeDoor === "function") {
      doc.removeDoor(this.door.id);
    }

    const existingDoors: DoorData[] = (window as any).__floorPlanActiveDocumentInstance?.customDrawnDoors || [];
    const filteredDoorsPool = existingDoors.filter((d) => d.id !== this.door.id);

    if ((window as any).__floorPlanActiveDocumentInstance) {
      (window as any).__floorPlanActiveDocumentInstance.customDrawnDoors = filteredDoorsPool;
      (window as any).__floorPlanActiveDocumentInstance.doors = filteredDoorsPool;
    }

    store.dispatch({
      type: "floorPlan/syncDocumentState",
    });

    store.dispatch({
      type: "floorPlan/setSelection",
      payload: this.previouslyActiveSelection,
    });

    window.dispatchEvent(new CustomEvent("sbs:canvas-update"));
    window.dispatchEvent(new CustomEvent("canvas-invalidate"));
    this.executed = false;
  }

  public redo(): void {
    this.execute();
  }
}

export default AddDoorCommand;