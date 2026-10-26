// src/modules/FloorPlanDesigner/Document/DocumentEvent.ts

export enum DocumentEventType {
  Changed = "Changed",
  SelectionChanged = "SelectionChanged",
  Undo = "Undo",
  Redo = "Redo"
}

export interface IDocumentEvent {
  type: DocumentEventType;
  source: any;
  payload?: unknown;
  timestamp?: number;
}

export class DocumentEvent implements IDocumentEvent {
  constructor(
    public type: DocumentEventType,
    public source: any,
    public payload?: unknown,
    public timestamp: number = Date.now()
  ) {}
}