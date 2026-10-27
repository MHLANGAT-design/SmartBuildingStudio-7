// BaseTool.ts - COMPLETE STABILIZED CORE CONTRACT
// ✅ Dynamic viewport getter with global fallback

import { ITool, ToolPointerEvent } from "@/modules/FloorPlanDesigner/Tools/Base/ITool";
import { ToolContext } from "@/modules/FloorPlanDesigner/Tools/Base/ToolContext";
import { SnapService } from "@/modules/FloorPlanDesigner/Utils/SnapService";

export abstract class BaseTool implements ITool {
    protected context!: ToolContext;
    private _viewport?: any;
    private active = false;

    constructor() {
        this.handleGlobalKeyDown = this.handleGlobalKeyDown.bind(this);
    }

    // ✅ Dynamic getter: returns the tool's own viewport, then context's, then global
    public get viewport(): any {
        return this._viewport || this.context?.viewport || (window as any).__viewport || (window as any).__floorPlanActiveViewportInstance || null;
    }

    // ✅ Setter: stores the viewport on the tool itself
    public set viewport(value: any) {
        this._viewport = value;
    }

    public abstract getId(): string;
    public abstract getName(): string;

    public activate(context: ToolContext): void {
        this.context = context;
        this.active = true;
        // Ensure the viewport is set from context or global
        this._viewport = context?.viewport || (window as any).__viewport || (window as any).__floorPlanActiveViewportInstance;

        this.onActivate();

        window.removeEventListener("keydown", this.handleGlobalKeyDown);
        window.addEventListener("keydown", this.handleGlobalKeyDown);
    }

    public deactivate(): void {
        this.active = false;
        this.onDeactivate();
        window.removeEventListener("keydown", this.handleGlobalKeyDown);
    }

    protected onActivate(): void {}
    protected onDeactivate(): void {}

    public isActive(): boolean {
        return this.active;
    }

    protected applyInitialSnap(targetTool: any): boolean {
        const snapSource = SnapService.lastActiveSnap;
        const rawResult = (window as any).__floorPlanLastSnapResultRaw;

        if (!snapSource || !snapSource.world || !rawResult || !rawResult.type) {
            return false;
        }

        const initialPoint = { x: snapSource.world.x, y: snapSource.world.y };

        if (targetTool.vertices && Array.isArray(targetTool.vertices)) {
            targetTool.vertices.length = 0;
            targetTool.vertices.push({ ...initialPoint });
        }
        if ("startPoint" in targetTool) {
            targetTool.startPoint = { ...initialPoint };
        }
        if ("currentPoint" in targetTool) {
            targetTool.currentPoint = { ...initialPoint };
        }
        if ("hoveredWallId" in targetTool) targetTool.hoveredWallId = rawResult.wallId;
        if ("currentSnapType" in targetTool) targetTool.currentSnapType = rawResult.type;
        if ("activeWallStart" in targetTool) targetTool.activeWallStart = rawResult.wallStart;
        if ("activeWallEnd" in targetTool) targetTool.activeWallEnd = rawResult.wallEnd;

        this.requestRender();
        return true;
    }

    public handleGlobalKeyDown(e: KeyboardEvent): void {
        if (!this.active) return;

        if (e.key === "Escape" || e.key === "Esc") {
            e.preventDefault();
            e.stopPropagation();

            this.cancel();

            if (this.getId() !== "select") {
                window.dispatchEvent(new CustomEvent("sbs:tool-change", { detail: { id: "select" } }));
                window.dispatchEvent(new CustomEvent("canvas-invalidate"));
            }
        }
    }

    public onPointerDown(_event: ToolPointerEvent): void {}
    public onPointerMove(_event: ToolPointerEvent): void {}
    public onPointerUp(_event: ToolPointerEvent): void {}
    public onDoubleClick(_event: ToolPointerEvent): void {}
    public onKeyDown(_event: KeyboardEvent): void {}
    public onKeyUp(_event: KeyboardEvent): void {}

    public cancel(): void {
        this.requestRender();
    }

    public renderOverlay(_context: CanvasRenderingContext2D): void {}

    protected requestRender(): void {
        try {
            if (this.context && typeof this.context.requestRender === "function") {
                this.context.requestRender();
            } else {
                window.dispatchEvent(new CustomEvent("sbs:canvas-update"));
                window.dispatchEvent(new CustomEvent("canvas-invalidate"));
            }
        } catch (e) {}
    }

    protected setStatus(message: string): void {
        if (this.context && typeof this.context.setStatus === "function") {
            this.context.setStatus(message);
        } else {
            window.dispatchEvent(new CustomEvent("sbs:status-update", { detail: { text: message } }));
        }
    }

    protected setCursor(cursor: string): void {
        const canvasElement = document.querySelector("canvas");
        if (canvasElement) {
            canvasElement.style.cursor = cursor;
        }
    }

    protected getDocument() { return this.context?.document || (window as any).__floorPlanActiveDocumentInstance; }
    protected getCommandManager() { return this.context?.commandManager || { execute: (cmd: any) => console.log(cmd) }; }
    protected getDocumentManager() { return this.context?.documentManager || null; }
}

export default BaseTool;