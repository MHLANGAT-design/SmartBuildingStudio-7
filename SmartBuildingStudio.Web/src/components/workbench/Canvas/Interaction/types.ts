export interface CanvasPoint {
    x: number;
    y: number;
}

export interface CanvasSelection {
    start: CanvasPoint;
    current: CanvasPoint;
}

export interface CanvasViewport {
    zoom: number;
    offsetX: number;
    offsetY: number;
}

export interface CanvasInteractionState {
    mouse: CanvasPoint;
    world: CanvasPoint;
    viewport: CanvasViewport;
    selecting: boolean;
    panning: boolean;
    selection?: CanvasSelection;
}

export interface CanvasInteractionCallbacks {
    onMouseDown?(point: CanvasPoint): void;
    onMouseMove?(point: CanvasPoint): void;
    onMouseUp?(point: CanvasPoint): void;
    onDoubleClick?(point: CanvasPoint): void;
    onContextMenu?(point: CanvasPoint): void;
}
