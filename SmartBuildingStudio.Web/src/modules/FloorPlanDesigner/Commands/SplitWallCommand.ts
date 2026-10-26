import { ICommand } from "@/modules/FloorPlanDesigner/Commands/ICommand";
import { DrawingDocument } from "@/modules/FloorPlanDesigner/Document/DrawingDocument";
import { Wall } from "@/modules/FloorPlanDesigner/Models/Wall";

export class SplitWallCommand implements ICommand {
  private readonly id: string;
  private readonly document: DrawingDocument;
  private readonly targetWallId: string;
  private readonly splitX: number;
  private readonly splitY: number;

  // Transaction backup parameters
  private originalWall?: Wall;
  private splitWallA?: Wall;
  private splitWallB?: Wall;
  private executed = false;

  constructor(
    document: DrawingDocument,
    targetWallId: string,
    splitX: number,
    splitY: number
  ) {
    this.id = `split-wall-${crypto.randomUUID()}`;
    this.document = document;
    this.targetWallId = targetWallId;
    this.splitX = splitX;
    this.splitY = splitY;
  }

  public getId(): string {
    return this.id;
  }

  public getDescription(): string {
    return "Split Wall Segment";
  }

  public isExecuted(): boolean {
    return this.executed;
  }

  public execute(): void {
    if (this.executed) return;

    this.originalWall = this.document.findWall(this.targetWallId);
    if (!this.originalWall) {
      throw new Error(
        `Cannot execute split: Target wall segment ID "${this.targetWallId}" not found in current document context.`
      );
    }

    // Read the original wall's properties through its getter methods.
    const originalStart = this.originalWall.getStart();
    const originalEnd = this.originalWall.getEnd();
    const thickness = this.originalWall.getThickness();
    const height = this.originalWall.getHeight();
    const metadata = this.originalWall.getMetadata();

    // Build the two split halves using the current Wall constructor:
    //   new Wall(metadata, geometry, props?)
    this.splitWallA = new Wall(
      { ...metadata, id: `wall-${crypto.randomUUID()}` },
      {
        start: { x: originalStart.x, y: originalStart.y },
        end: { x: this.splitX, y: this.splitY },
      },
      { thickness, height }
    );

    this.splitWallB = new Wall(
      { ...metadata, id: `wall-${crypto.randomUUID()}` },
      {
        start: { x: this.splitX, y: this.splitY },
        end: { x: originalEnd.x, y: originalEnd.y },
      },
      { thickness, height }
    );

    // Swap the original for the two halves.
    this.document.removeWall(this.targetWallId);
    this.document.addWall(this.splitWallA);
    this.document.addWall(this.splitWallB);

    this.executed = true;
  }

  public undo(): void {
    if (
      !this.executed ||
      !this.originalWall ||
      !this.splitWallA ||
      !this.splitWallB
    )
      return;

    // Remove the two halves, restore the original.
    this.document.removeWall(this.splitWallA.getId());
    this.document.removeWall(this.splitWallB.getId());
    this.document.addWall(this.originalWall);

    this.executed = false;
  }

  public redo(): void {
    if (this.executed || !this.splitWallA || !this.splitWallB) return;

    this.document.removeWall(this.targetWallId);
    this.document.addWall(this.splitWallA);
    this.document.addWall(this.splitWallB);

    this.executed = true;
  }
}