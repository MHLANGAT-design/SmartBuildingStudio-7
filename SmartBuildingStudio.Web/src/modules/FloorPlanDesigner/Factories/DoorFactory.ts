import { Door } from "@/modules/FloorPlanDesigner/Models/Door";
import { Point2D } from "@/modules/FloorPlanDesigner/Models/Base/Geometry";

export interface CreateDoorOptions {

    /**
     * Door insertion point.
     */
    position: Point2D;

    /**
     * Host wall identifier.
     */
    wallId: string;

    /**
     * Door width (mm)
     *
     * Default: 900
     */
    width?: number;

    /**
     * Door height (mm)
     *
     * Default: 2100
     */
    height?: number;

    /**
     * Opening angle.
     *
     * Default: 90°
     */
    swingAngle?: number;

    /**
     * Left or right handed.
     */
    handedness?: "left" | "right";

    /**
     * Optional name.
     */
    name?: string;
}

export class DoorFactory {

    public static readonly DEFAULT_WIDTH = 900;

    public static readonly DEFAULT_HEIGHT = 2100;

    public static readonly DEFAULT_SWING = 90;

    public static readonly DEFAULT_HANDEDNESS = "left";

    public static create(
        options: CreateDoorOptions
    ): Door {

        return new Door({

            position: options.position,

            wallId: options.wallId,

            width:
                options.width ??
                DoorFactory.DEFAULT_WIDTH,

            height:
                options.height ??
                DoorFactory.DEFAULT_HEIGHT,

            swingAngle:
                options.swingAngle ??
                DoorFactory.DEFAULT_SWING,

            handedness:
                options.handedness ??
                DoorFactory.DEFAULT_HANDEDNESS,

            name: options.name
        });
    }
}