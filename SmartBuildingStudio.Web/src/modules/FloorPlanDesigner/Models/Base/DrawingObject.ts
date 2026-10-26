import { DrawingMetadata } from "@/modules/FloorPlanDesigner/Models/Base/Metadata";
import { DrawingStyle } from "@/modules/FloorPlanDesigner/Models/Base/Style";

export abstract class DrawingObject {
    protected metadata: DrawingMetadata;
    protected style: DrawingStyle;
    protected visible = true;
    protected locked = false;

    constructor(
        metadata: DrawingMetadata,
        style?: Partial<DrawingStyle>
    ) {
        this.metadata = metadata;
        this.style = {
            strokeColor: "#111827",
            fillColor: "#ffffff",
            opacity: 1,
            visible: true,
            locked: false,
            lineWidth: 1,
            ...style
        };
    }

    // -----------------------------
    // Identity
    // -----------------------------

    public getId(): string {
        return this.metadata.id;
    }

    public getMetadata(): DrawingMetadata {
        return this.metadata;
    }

    public touch(): void {
        this.metadata.modifiedAt = new Date();
    }

    // -----------------------------
    // Style
    // -----------------------------

    public getStyle(): DrawingStyle {
        return this.style;
    }

    public updateStyle(style: Partial<DrawingStyle>): void {
        this.style = {
            ...this.style,
            ...style
        };
        this.touch();
    }

    // -----------------------------
    // Visibility
    // -----------------------------

    public isVisible(): boolean {
        return this.style.visible;
    }

    public setVisible(value: boolean): void {
        this.style.visible = value;
        this.touch();
    }

    // -----------------------------
    // Locking
    // -----------------------------

    public isLocked(): boolean {
        return this.style.locked;
    }

    public setLocked(value: boolean): void {
        this.style.locked = value;
        this.touch();
    }

    // -----------------------------
    // Required polymorphism
    // -----------------------------

    abstract clone(): DrawingObject;
}
