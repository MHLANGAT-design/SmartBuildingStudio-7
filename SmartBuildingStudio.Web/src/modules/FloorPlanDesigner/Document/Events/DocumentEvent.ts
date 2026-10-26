/**
 * ============================================================================
 * Base class for every DrawingDocument event.
 * ============================================================================
 */

export enum EventCategory {
    Document = "Document",
    Geometry = "Geometry",
    Layer = "Layer",
    Selection = "Selection",
    Fixture = "Fixture",
    Command = "Command",
    View = "View"
}

export abstract class DocumentEvent {
    protected constructor(
        public readonly category: EventCategory,
        public readonly timestamp: Date = new Date(),
        public readonly sender?: unknown
    ) {}
}
