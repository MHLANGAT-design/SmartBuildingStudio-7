// src/modules/FloorPlanDesigner/Commands/DeleteDoorsCommand.ts
import { ICommand } from "@/modules/FloorPlanDesigner/Commands/ICommand";
import { DrawingDocument } from "@/modules/FloorPlanDesigner/Document/DrawingDocument";

export interface DeleteDoorsCommandOptions {
  document: DrawingDocument;
  doorIds: string[];
}

export class DeleteDoorsCommand implements ICommand {
  private readonly id: string;
  private readonly document: DrawingDocument;
  private readonly doorIds: string[];
  private removedDoors: any[] = [];
  private removedElements: any[] = [];
  private executed = false;

  constructor(options: DeleteDoorsCommandOptions) {
    this.id = `cmd_${Date.now()}_${Math.random()}`;
    this.document = options.document;
    this.doorIds = options.doorIds;
  }

  public getId(): string { return this.id; }
  public getDescription(): string { return "Delete Doors"; }
  public isExecuted(): boolean { return this.executed; }

  public execute(): void {
    if (this.executed) return;

    this.removedDoors = [];
    this.removedElements = [];

    // The runtime DrawingDocument instance carries the raw elements/doors
    // arrays and (in some builds) helper methods. The class declaration
    // has been slimmed down to the add/get surface only. Cast through
    // `any` so we can still read/write the underlying arrays without
    // changing the runtime behavior of the command.
    const doc: any = this.document;

    for (const id of this.doorIds) {
      let door: any = null;

      // Search in elements array
      if (doc.elements && Array.isArray(doc.elements)) {
        const index = doc.elements.findIndex(
          (el: any) =>
            (el.id === id || el.Id === id) &&
            (String(el.type || '').toLowerCase() === 'door' ||
              String(el.type || '').toLowerCase() === 'doors')
        );
        if (index !== -1) {
          door = doc.elements[index];
          this.removedElements.push({ element: door, index });
          doc.elements.splice(index, 1);
        }
      }

      // Search in doors array
      if (doc.doors && Array.isArray(doc.doors)) {
        const doorInDoors = doc.doors.find((d: any) => d.id === id || d.Id === id);
        if (doorInDoors) {
          if (!door) door = doorInDoors;
          this.removedDoors.push(doorInDoors);
          doc.doors = doc.doors.filter((d: any) => d.id !== id && d.Id !== id);
        }
      }

      if (typeof doc.findDoor === 'function') {
        const foundDoor = doc.findDoor(id);
        if (foundDoor && !door) door = foundDoor;
      }

      if (typeof doc.removeDoor === 'function') {
        doc.removeDoor(id);
      }
    }

    this.executed = true;

    // Update Redux / global mirror
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

    for (const door of this.removedDoors) {
      if (typeof doc.addDoor === 'function') {
        doc.addDoor(door);
      }
      if (doc.doors && Array.isArray(doc.doors)) {
        doc.doors.push(door);
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