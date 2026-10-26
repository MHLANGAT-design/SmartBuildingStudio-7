import { ICommand } from "@/modules/FloorPlanDesigner/Commands/ICommand";
import { DrawingDocument } from "@/modules/FloorPlanDesigner/Document/DrawingDocument";
import { Wall } from "@/modules/FloorPlanDesigner/Models/Wall";

export class MergeWallsCommand implements ICommand {
  private readonly id: string;
  private readonly document: DrawingDocument;
  private readonly wallIdA: string;
  private readonly wallIdB: string;

  // Backup buffers for structural undo restoration
  private originalWallA?: Wall;
  private originalWallB?: Wall;
  private mergedWall?: Wall;
  private executed = false;

  constructor(document: DrawingDocument, wallIdA: string, wallIdB: string) {
    this.id = `merge-walls-${crypto.randomUUID()}`;
    this.document = document;
    this.wallIdA = wallIdA;
    this.wallIdB = wallIdB;
  }

  public getId(): string {
    return this.id;
  }

  public getDescription(): string {
    return "Merge Colinear Walls";
  }

  public isExecuted(): boolean {
    return this.executed;
  }

  public execute(): void {
    if (this.executed) return;

    this.originalWallA = this.document.findWall(this.wallIdA);
    this.originalWallB = this.document.findWall(this.wallIdB);

    if (!this.originalWallA || !this.originalWallB) {
      throw new Error(
        "Cannot execute merge: One or both target structural walls could not be resolved."
      );
    }

    // Read both walls' endpoints through their getter methods.
    const aStart = this.originalWallA.getStart();
    const aEnd = this.originalWallA.getEnd();
    const bStart = this.originalWallB.getStart();
    const bEnd = this.originalWallB.getEnd();

    const points = [
      { x: aStart.x, y: aStart.y },
      { x: aEnd.x, y: aEnd.y },
      { x: bStart.x, y: bStart.y },
      { x: bEnd.x, y: bEnd.y },
    ];

    // Find the unique endpoints out of the vertex pool (removing duplicate connecting vectors)
    const uniquePoints = points.filter(
      (p, index, self) =>
        self.findIndex((t) => t.x === p.x && t.y === p.y) === index
    );

    if (uniquePoints.length !== 3) {
      throw new Error(
        "Cannot execute merge: Selected structural walls do not share a clean unified corner point."
      );
    }

    // Determine the two farthest boundary vertices to establish the new wall envelope
    let startPoint = uniquePoints[0];
    let endPoint = uniquePoints[1];
    let maxDist = Math.hypot(
      endPoint.x - startPoint.x,
      endPoint.y - startPoint.y
    );

    for (let i = 0; i < uniquePoints.length; i++) {
      for (let j = i + 1; j < uniquePoints.length; j++) {
        const d = Math.hypot(
          uniquePoints[j].x - uniquePoints[i].x,
          uniquePoints[j].y - uniquePoints[i].y
        );
        if (d > maxDist) {
          maxDist = d;
          startPoint = uniquePoints[i];
          endPoint = uniquePoints[j];
        }
      }
    }

    // Read shared properties for the merged wall.
    const thickness = this.originalWallA.getThickness();
    const height = this.originalWallA.getHeight();
    const metadata = this.originalWallA.getMetadata();

    // Instantiate a new consolidated structural wall retaining metadata attributes.
    // Current Wall constructor: (metadata, geometry, props?)
    this.mergedWall = new Wall(
      { ...metadata, id: `wall-${crypto.randomUUID()}` },
      {
        start: { x: startPoint.x, y: startPoint.y },
        end: { x: endPoint.x, y: endPoint.y },
      },
      { thickness, height }
    );

    // Apply structural transactions to document collections
    this.document.removeWall(this.wallIdA);
    this.document.removeWall(this.wallIdB);
    this.document.addWall(this.mergedWall);

    this.executed = true;
  }

  public undo(): void {
    if (
      !this.executed ||
      !this.originalWallA ||
      !this.originalWallB ||
      !this.mergedWall
    )
      return;

    // Purge the consolidated wall element and restore original segment boundaries
    this.document.removeWall(this.mergedWall.getId());
    this.document.addWall(this.originalWallA);
    this.document.addWall(this.originalWallB);

    this.executed = false;
  }

  public redo(): void {
    if (this.executed || !this.mergedWall) return;

    this.document.removeWall(this.wallIdA);
    this.document.removeWall(this.wallIdB);
    this.document.addWall(this.mergedWall);

    this.executed = true;
  }
}