import { Point2D } from "@/modules/FloorPlanDesigner/Models/Base/Geometry";

export type ImportedDrawingType =
    | "dwg"
    | "dxf"
    | "pdf"
    | "svg"
    | "ifc";

export interface ImportedDrawingOptions {
    id: string;
    name: string;
    fileName: string;
    type: ImportedDrawingType;
    sourcePath: string;
}

export class ImportedDrawing {
    private id: string;
    private name: string;
    private fileName: string;
    private type: ImportedDrawingType;
    private sourcePath: string;
    private origin: Point2D = { x: 0, y: 0 };
    private scale = 1;
    private rotation = 0;
    private visible = true;
    private locked = false;

    constructor(options: ImportedDrawingOptions) {
        this.id = options.id;
        this.name = options.name;
        this.fileName = options.fileName;
        this.type = options.type;
        this.sourcePath = options.sourcePath;
    }

    public getId(): string {
        return this.id;
    }

    public getOrigin(): Point2D {
        return this.origin;
    }

    public setOrigin(origin: Point2D): void {
        this.origin = origin;
    }

    public getScale(): number {
        return this.scale;
    }

    public setScale(scale: number): void {
        this.scale = scale;
    }

    public getRotation(): number {
        return this.rotation;
    }

    public setRotation(rotation: number): void {
        this.rotation = rotation;
    }

    public isVisible(): boolean {
        return this.visible;
    }

    public setVisible(value: boolean): void {
        this.visible = value;
    }

    public isLocked(): boolean {
        return this.locked;
    }

    public setLocked(value: boolean): void {
        this.locked = value;
    }

    public getSourcePath(): string {
        return this.sourcePath;
    }

    public getType(): ImportedDrawingType {
        return this.type;
    }
}
