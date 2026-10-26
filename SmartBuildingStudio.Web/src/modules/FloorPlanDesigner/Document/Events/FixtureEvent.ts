import { DocumentEvent, EventCategory } from "@/modules/FloorPlanDesigner/Document/Events/DocumentEvent";

export enum FixtureOperation {
    Added,
    Updated,
    Removed,
    AddressAssigned,
    GroupChanged
}

export class FixtureEvent extends DocumentEvent {
    constructor(
        public readonly operation: FixtureOperation,
        public readonly fixtureId: string,
        public readonly payload?: unknown,
        sender?: unknown
    ) {
        super(EventCategory.Fixture, new Date(), sender);
    }
}
