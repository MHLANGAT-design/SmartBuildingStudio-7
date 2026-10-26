import { RenderContext } from "@/modules/FloorPlanDesigner/Canvas/RenderContext";

export interface IRenderLayer {
  getId(): string;
  getName(): string;
  isVisible(): boolean;
  setVisible(visible: boolean): void;

  /**
   * NEW: rendering order control (higher = drawn later / on top)
   */
  getZIndex(): number;

  render(context: CanvasRenderingContext2D, renderContext: RenderContext): void;
}
