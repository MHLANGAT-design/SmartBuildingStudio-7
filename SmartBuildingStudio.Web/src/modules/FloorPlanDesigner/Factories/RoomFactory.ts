import { Room } from "@/modules/FloorPlanDesigner/Models/Room";
import { Point2D } from "@/modules/FloorPlanDesigner/Models/Base/Geometry";

export interface CreateRoomOptions {
    /**
     * Room name.
     */
    name?: string;

    /**
     * Polygon vertices.
     */
    vertices: Point2D[];

    /**
     * Room height (mm)
     */
    height?: number;

    /**
     * Optional floor finish.
     */
    floorFinish?: string;

    /**
     * Optional ceiling finish.
     */
    ceilingFinish?: string;
}

export class RoomFactory {
    /**
     * Default room height (mm)
     */
    public static readonly DEFAULT_HEIGHT = 3000;

    public static create(options: CreateRoomOptions): Room {
        return new Room({
            name: options.name,
            vertices: [...options.vertices],
            height: options.height ?? RoomFactory.DEFAULT_HEIGHT,
            floorFinish: options.floorFinish,
            ceilingFinish: options.ceilingFinish
        });
    }
}
