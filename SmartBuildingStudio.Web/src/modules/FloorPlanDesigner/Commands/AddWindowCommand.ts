// src/modules/FloorPlanDesigner/Commands/AddWindowCommand.ts
import { ICommand } from "@/modules/FloorPlanDesigner/Commands/ICommand";
import { DrawingDocument } from "@/modules/FloorPlanDesigner/Document/DrawingDocument";
import { Window } from "@/modules/FloorPlanDesigner/Models/Window";
import { Point2D } from "@/modules/FloorPlanDesigner/Models/Base/Geometry";
import { store } from "@/Application/ConfigureStore";

export interface AddWindowCommandOptions {
  document: DrawingDocument;
  window: Window;
  position?: Point2D;
  endPosition?: Point2D;
}

export class AddWindowCommand implements ICommand {
  private readonly id: string;
  private readonly document: DrawingDocument;
  private readonly window: Window;
  private executed = false;
  private previouslyActiveSelection: any | null = null;
  private savedWindowData: any = null;

  constructor(options: AddWindowCommandOptions) {
    this.id = `cmd_${Date.now()}_${Math.random()}`;
    this.document = options.document;
    this.window = options.window;

    if (this.window) {
      const currentPos = (this.window as any).position || (this.window as any).Position || (this.window as any).start;
      const currentEnd = (this.window as any).endPosition || (this.window as any).EndPosition || (this.window as any).end;
      const customLabelId = (this.window as any).id || (this.window as any).name;

      if (!options.position && currentPos) {
        (options as any).position = { x: currentPos.x, y: currentPos.y };
      }
      if (!options.endPosition && currentEnd) {
        (options as any).endPosition = { x: currentEnd.x, y: currentEnd.y };
      }
      if (customLabelId && !(this.window as any).id) {
        (this.window as any).id = customLabelId;
      }
    }
  }

  public getId(): string { return this.id; }
  public getDescription(): string { return "Add Window"; }
  public isExecuted(): boolean { return this.executed; }

  public execute(): void {
    if (this.executed) return;

    const currentGlobalState = store.getState().floorPlan || (store.getState() as any).FloorPlan;
    this.previouslyActiveSelection = currentGlobalState?.selection || null;

    if (this.document && typeof this.document.addWindow === "function") {
      this.document.addWindow(this.window);
    }

    const targetWindowId = this.window.getId?.() || (this.window as any).id;
    const currentPos = (this.window as any).position || (this.window as any).start;
    const currentEnd = (this.window as any).endPosition || (this.window as any).end;
    const activeHostId = (this.window as any).wallId || "dwg-wall-root";

    this.savedWindowData = {
      id: targetWindowId,
      type: "Window",
      name: targetWindowId,
      width: 1200,
      vlt: 0.70,
      start: currentPos ? { x: currentPos.x, y: currentPos.y } : { x: 0, y: 0 },
      end: currentEnd ? { x: currentEnd.x, y: currentEnd.y } : { x: 0, y: 0 },
      wallId: activeHostId
    };

    if ((window as any).__floorPlanActiveDocumentInstance) {
      const activeGlobalPool = (window as any).__floorPlanActiveDocumentInstance.customDrawnWindows || [];
      if (!activeGlobalPool.some((w: any) => w.id === targetWindowId)) {
        activeGlobalPool.push(this.savedWindowData);
      }
      (window as any).__floorPlanActiveDocumentInstance.customDrawnWindows = activeGlobalPool;
      (window as any).__floorPlanActiveDocumentInstance.windows = [...activeGlobalPool];
    }

    this.executed = true;
  }

  public undo(): void {
    if (!this.executed) return;

    // DrawingDocument does not declare `removeWindow`, but a concrete
    // implementation may provide it. Cast to `any` for the guarded call.
    const doc: any = this.document;
    if (doc && typeof doc.removeWindow === "function") {
      doc.removeWindow(this.window.getId().toString());
    }

    const existingWindows = (window as any).__floorPlanActiveDocumentInstance?.customDrawnWindows || [];
    const targetWindowId = this.window.getId?.() || (this.window as any).id;
    const filteredWindowsPool = existingWindows.filter((w: any) => w.id !== targetWindowId);

    if ((window as any).__floorPlanActiveDocumentInstance) {
      (window as any).__floorPlanActiveDocumentInstance.customDrawnWindows = filteredWindowsPool;
      (window as any).__floorPlanActiveDocumentInstance.windows = filteredWindowsPool;
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

export default AddWindowCommand;