import { DocumentEvent, EventCategory } from "@/modules/FloorPlanDesigner/Document/Events/DocumentEvent";

export enum LayerOperation {
    Added,
    Updated,
    Removed,
    VisibilityChanged,
    Locked,
    Unlocked
}

export class LayerEvent extends DocumentEvent {
    constructor(
        public readonly operation: LayerOperation,
        public readonly layerId: string,
        public readonly payload?: unknown,
        sender?: unknown
    ) {
        super(EventCategory.Layer, new Date(), sender);
    }
}
