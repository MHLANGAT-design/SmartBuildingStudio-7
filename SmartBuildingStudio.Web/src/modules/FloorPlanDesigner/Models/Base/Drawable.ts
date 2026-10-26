import { Point2D } from "@/modules/FloorPlanDesigner/Models/Base/Geometry";
import { DrawingStyle } from "@/modules/FloorPlanDesigner/Models/Base/Style";

export interface Drawable {
    /**
     * Unique identifier
     */
    id: string;

    /**
     * Render the object on canvas
     */
    draw(ctx: CanvasRenderingContext2D, zoom: number): void;

    /**
     * Hit test (selection logic)
     */
    containsPoint(point: Point2D): boolean;

    /**
     * Bounding box for fast spatial queries
     */
    getBounds(): {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    };

    /**
     * Style used for rendering
     */
    getStyle(): DrawingStyle;

    /**
     * Visibility flag
     */
    isVisible(): boolean;

    /**
     * Locking flag
     */
    isLocked(): boolean;
}
