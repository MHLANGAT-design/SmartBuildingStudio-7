import { DocumentEvent, EventCategory } from "@/modules/FloorPlanDesigner/Document/Events/DocumentEvent";

export class SelectionEvent extends DocumentEvent {
    constructor(
        public readonly selectedIds: string[],
        sender?: unknown
    ) {
        super(EventCategory.Selection, new Date(), sender);
    }
}
