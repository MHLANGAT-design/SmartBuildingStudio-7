import { Wall } from "@/modules/FloorPlanDesigner/Models/Wall";
import { Point2D } from "@/modules/FloorPlanDesigner/Models/Base/Geometry";

export interface CreateWallOptions {
    /**
     * Wall start point.
     */
    start: Point2D;

    /**
     * Wall end point.
     */
    end: Point2D;

    /**
     * Wall thickness in millimetres.
     *
     * Default: 150
     */
    thickness?: number;

    /**
     * Wall height in millimetres.
     *
     * Default: 3000
     */
    height?: number;

    /**
     * Optional wall name.
     */
    name?: string;
}

export class WallFactory {
    /**
     * Default wall thickness (mm)
     */
    public static readonly DEFAULT_THICKNESS = 150;

    /**
     * Default wall height (mm)
     */
    public static readonly DEFAULT_HEIGHT = 3000;

    /**
     * Creates a wall using the project's default values.
     */
    public static create(options: CreateWallOptions): Wall {
        return new Wall({
            start: options.start,
            end: options.end,
            thickness: options.thickness ?? WallFactory.DEFAULT_THICKNESS,
            height: options.height ?? WallFactory.DEFAULT_HEIGHT,
            name: options.name
        });
    }
}
