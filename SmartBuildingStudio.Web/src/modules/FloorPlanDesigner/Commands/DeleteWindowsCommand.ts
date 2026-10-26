// src/modules/FloorPlanDesigner/Commands/DeleteWindowsCommand.ts
import { ICommand } from "@/modules/FloorPlanDesigner/Commands/ICommand";
import { DrawingDocument } from "@/modules/FloorPlanDesigner/Document/DrawingDocument";

export interface DeleteWindowsCommandOptions {
  document: DrawingDocument;
  windowIds: string[];
}

export class DeleteWindowsCommand implements ICommand {
  private readonly id: string;
  private readonly document: DrawingDocument;
  private readonly windowIds: string[];
  private removedWindows: any[] = [];
  private removedElements: any[] = [];
  private executed = false;

  constructor(options: DeleteWindowsCommandOptions) {
    this.id = `cmd_${Date.now()}_${Math.random()}`;
    this.document = options.document;
    this.windowIds = options.windowIds;
  }

  public getId(): string { return this.id; }
  public getDescription(): string { return "Delete Windows"; }
  public isExecuted(): boolean { return this.executed; }

  public execute(): void {
    if (this.executed) return;

    this.removedWindows = [];
    this.removedElements = [];

    // Cast to any — see DeleteDoorsCommand for rationale.
    const doc: any = this.document;

    for (const id of this.windowIds) {
      let window: any = null;

      if (doc.elements && Array.isArray(doc.elements)) {
        const index = doc.elements.findIndex(
          (el: any) =>
            (el.id === id || el.Id === id) &&
            (String(el.type || '').toLowerCase() === 'window' ||
              String(el.type || '').toLowerCase() === 'windows')
        );
        if (index !== -1) {
          window = doc.elements[index];
          this.removedElements.push({ element: window, index });
          doc.elements.splice(index, 1);
        }
      }

      if (doc.windows && Array.isArray(doc.windows)) {
        const windowInWindows = doc.windows.find(
          (w: any) => w.id === id || w.Id === id
        );
        if (windowInWindows) {
          if (!window) window = windowInWindows;
          this.removedWindows.push(windowInWindows);
          doc.windows = doc.windows.filter((w: any) => w.id !== id && w.Id !== id);
        }
      }

      if (typeof doc.findWindow === 'function') {
        const foundWindow = doc.findWindow(id);
        if (foundWindow && !window) window = foundWindow;
      }

      if (typeof doc.removeWindow === 'function') {
        doc.removeWindow(id);
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

    for (const window of this.removedWindows) {
      if (typeof doc.addWindow === 'function') {
        doc.addWindow(window);
      }
      if (doc.windows && Array.isArray(doc.windows)) {
        doc.windows.push(window);
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