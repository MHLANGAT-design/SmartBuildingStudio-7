import { DocumentEvent, EventCategory } from "@/modules/FloorPlanDesigner/Document/Events/DocumentEvent";

export enum DocumentLifecycleOperation {
    Created,
    Opened,
    Loaded,
    Saving,
    Saved,
    Closed,
    Dirty,
    Clean
}

export class DocumentLifecycleEvent extends DocumentEvent {
    constructor(
        public readonly operation: DocumentLifecycleOperation,
        sender?: unknown
    ) {
        super(EventCategory.Document, new Date(), sender);
    }
}
