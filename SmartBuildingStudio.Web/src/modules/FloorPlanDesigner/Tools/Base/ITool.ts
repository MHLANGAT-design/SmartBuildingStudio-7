import { ToolContext } from "@/modules/FloorPlanDesigner/Tools/Base/ToolContext";

/**
 * Mouse button definitions.
 */
export enum MouseButton {
    Left = 0,
    Middle = 1,
    Right = 2
}

/**
 * Keyboard modifier keys.
 */
export interface KeyModifiers {
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
    meta: boolean;
}

/**
 * Standard pointer information supplied to every tool.
 */
export interface ToolPointerEvent {
    /**
     * Screen (canvas) coordinates.
     */
    screenX: number;
    screenY: number;

    /**
     * World coordinates.
     */
    worldX: number;
    worldY: number;
    button: MouseButton;
    modifiers: KeyModifiers;
    originalEvent: PointerEvent;
}

/**
 * Every editing tool in FloorPlanDesigner implements this interface.
 */
export interface ITool {
    /**
     * Unique tool identifier.
     *
     * Example:
     * wall
     * door
     * select
     */
    getId(): string;

    /**
     * Display name.
     */
    getName(): string;

    /**
     * Called when the tool becomes active.
     */
    activate(context: ToolContext): void;

    /**
     * Called before another tool becomes active.
     */
    deactivate(): void;

    /**
     * Pointer pressed.
     */
    onPointerDown(event: ToolPointerEvent): void;

    /**
     * Pointer moved.
     */
    onPointerMove(event: ToolPointerEvent): void;

    /**
     * Pointer released.
     */
    onPointerUp(event: ToolPointerEvent): void;

    /**
     * Double-click.
     */
    onDoubleClick(event: ToolPointerEvent): void;

    /**
     * Keyboard pressed.
     */
    onKeyDown(event: KeyboardEvent): void;

    /**
     * Keyboard released.
     */
    onKeyUp(event: KeyboardEvent): void;

    /**
     * Cancels the current operation.
     *
     * Typically called when Esc is pressed.
     */
    cancel(): void;

    /**
     * Draw temporary graphics
     * (rubber-band lines, previews, etc.)
     */
    renderOverlay(context: CanvasRenderingContext2D): void;
}
