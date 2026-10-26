import { Room } from "@/modules/FloorPlanDesigner/Models/Room";
import { Wall } from "@/modules/FloorPlanDesigner/Models/Wall";
import { Point2D } from "@/modules/FloorPlanDesigner/Models/Base/Geometry";
import { GeometryService } from "@/modules/FloorPlanDesigner/Services/Geometry/GeometryService";

export class RoomDetectionService {
  /**
   * Attempts to detect rooms from a collection of walls.
   * Assumes walls connect exactly at endpoints to form simple closed loops.
   */
  public static detectRooms(walls: readonly Wall[]): Room[] {
    const rooms: Room[] = [];
    const visited = new Set<string>();

    for (const wall of walls) {
      if (visited.has(wall.id)) continue;

      const loop = this.traceLoop(wall, walls, visited);
      if (loop.length >= 3) {
        const room = new Room();
        room.vertices = loop;
        rooms.push(room);
      }
    }

    return rooms;
  }

  /**
   * Traces a connected wall loop.
   */
  private static traceLoop(
    startWall: Wall,
    walls: readonly Wall[],
    visited: Set<string>
  ): Point2D[] {
    const vertices: Point2D[] = [];
    let current = startWall;

    while (true) {
      if (visited.has(current.id)) break;

      visited.add(current.id);
      vertices.push(current.start);

      // Find an unvisited wall that shares an endpoint with the current wall's end
      const next = walls.find(w => 
        !visited.has(w.id) && GeometryService.equals(current.end, w.start)
      );

      if (!next) break;

      current = next;

      // Close the loop if the current wall leads back to the start wall vertex location
      if (GeometryService.equals(current.end, startWall.start)) {
        vertices.push(current.end);
        break;
      }
    }

    return vertices;
  }
}
