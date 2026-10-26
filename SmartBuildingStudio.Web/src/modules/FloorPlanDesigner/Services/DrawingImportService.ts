import { ImportedDrawing } from "@/modules/FloorPlanDesigner/Models/ImportedDrawing";
import { Point2D } from "@/modules/FloorPlanDesigner/Models/Base/Geometry";
import { CalibrationResult } from "@/modules/FloorPlanDesigner/Services/CalibrationService";

export interface ImportDrawingOptions {
  /** World position where the drawing will initially be placed. */
  position?: Point2D;
  /** Optional calibration information. */
  calibration?: CalibrationResult;
  /** Initial opacity. */
  opacity?: number;
  /** Lock imported drawing. */
  locked?: boolean;
  /** Visible after import. */
  visible?: boolean;
}

export class DrawingImportService {
  /**
   * Imports an image file into an ImportedDrawing model.
   */
  public static async importImage(
    file: File,
    options: ImportDrawingOptions = {}
  ): Promise<ImportedDrawing> {
    if (!file) {
      throw new Error("No drawing file supplied.");
    }
    if (!file.type.startsWith("image/")) {
      throw new Error("Unsupported drawing format.");
    }

    const image = await this.loadImage(file);
    const drawing = new ImportedDrawing();

    drawing.image = image;
    drawing.position = options.position ?? { x: 0, y: 0 };
    drawing.opacity = options.opacity ?? 0.5;
    drawing.visible = options.visible ?? true;
    drawing.locked = options.locked ?? true;
    drawing.calibration = options.calibration;
    drawing.fileName = file.name;
    drawing.imageWidth = image.width;
    drawing.imageHeight = image.height;

    return drawing;
  }

  /**
   * Reads a file and loads it into an HTMLImageElement using object URLs for better memory management.
   */
  private static loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.onload = () => {
        URL.revokeObjectURL(objectUrl); // Clean up memory immediately after load
        resolve(image);
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Invalid image or unreadable drawing structure."));
      };

      image.src = objectUrl;
    });
  }
}
