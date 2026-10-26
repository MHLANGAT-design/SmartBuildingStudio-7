import { IRenderLayer } from "@/modules/FloorPlanDesigner/Canvas/Layers/IRenderLayer";
import { Viewport } from "@/modules/FloorPlanDesigner/Canvas/Viewport";
import { Selection } from "@/modules/FloorPlanDesigner/Models/Selection";
import { Drawable } from "@/modules/FloorPlanDesigner/Models/Base/Drawable";

export class SelectionLayer implements IRenderLayer {
  private visible = true;
  private selection?: Selection;
  private readonly handleSize = 6;

  public getId(): string {
    return "selection";
  }

  public getName(): string {
    return "Selection";
  }

  public isVisible(): boolean {
    return this.visible;
  }

  public setVisible(visible: boolean): void {
    this.visible = visible;
  }

  public setSelection(selection: Selection): void {
    this.selection = selection;
  }

  public render(context: CanvasRenderingContext2D, viewport: Viewport): void {
    if (!this.visible || !this.selection) return;

    const objects = this.selection.getSelectedObjects();
    if (objects.length === 0) return;

    const viewBounds = viewport.getVisibleBounds();

    context.save();
    context.strokeStyle = "#00A2FF";
    context.fillStyle = "#00A2FF";
    context.lineWidth = 2;

    for (const object of objects) {
      const bounds = object.getBounds();

      // Frustum culling: Skip rendering selection boxes for items off-screen
      if (
        bounds.right < viewBounds.left ||
        bounds.left > viewBounds.right ||
        bounds.bottom < viewBounds.top ||
        bounds.top > viewBounds.bottom
      ) {
        continue;
      }

      this.renderObjectSelection(context, viewport, bounds);
    }

    context.restore();
  }

  private renderObjectSelection(
    context: CanvasRenderingContext2D,
    viewport: Viewport,
    bounds: ReturnType<Drawable["getBounds"]>
  ): void {
    const topLeft = viewport.worldToScreen({ x: bounds.left, y: bounds.top });
    const bottomRight = viewport.worldToScreen({ x: bounds.right, y: bounds.bottom });

    const width = bottomRight.x - topLeft.x;
    const height = bottomRight.y - topLeft.y;

    // Selection box outline
    context.strokeRect(topLeft.x, topLeft.y, width, height);

    // Grab-handle locations
    const halfHandle = this.handleSize / 2;
    this.drawHandle(context, topLeft.x - halfHandle, topLeft.y - halfHandle);
    this.drawHandle(context, bottomRight.x - halfHandle, topLeft.y - halfHandle);
    this.drawHandle(context, topLeft.x - halfHandle, bottomRight.y - halfHandle);
    this.drawHandle(context, bottomRight.x - halfHandle, bottomRight.y - halfHandle);
  }

  private drawHandle(context: CanvasRenderingContext2D, x: number, y: number): void {
    context.fillRect(x, y, this.handleSize, this.handleSize);
  }
}
