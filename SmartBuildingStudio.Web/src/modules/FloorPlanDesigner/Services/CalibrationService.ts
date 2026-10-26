import { Point2D } from "@/modules/FloorPlanDesigner/Models/Base/Geometry";

export interface CalibrationResult {
  /** Millimetres represented by one image pixel. */
  millimetresPerPixel: number;
  /** Pixels represented by one millimetre. */
  pixelsPerMillimetre: number;
  /** Real-world distance used during calibration. */
  referenceDistance: number;
}

export class CalibrationService {
  /**
   * Calculates the drawing scale from two image points and their known real-world distance.
   * @param start First calibration point (pixels)
   * @param end Second calibration point (pixels)
   * @param referenceDistance Known distance in millimetres
   */
  public static calibrate(
    start: Point2D,
    end: Point2D,
    referenceDistance: number
  ): CalibrationResult {
    if (referenceDistance <= 0) {
      throw new Error("Reference distance must be greater than zero.");
    }

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);

    if (pixelDistance === 0) {
      throw new Error("Calibration points must not be identical.");
    }

    const millimetresPerPixel = referenceDistance / pixelDistance;

    return {
      millimetresPerPixel,
      pixelsPerMillimetre: 1 / millimetresPerPixel,
      referenceDistance,
    };
  }

  /**
   * 🚀 FIXED: Secure bridge calculator converting dialogue meter values to millimetres 
   * to guarantee the drawing canvas never collapses into a blank sub-pixel point!
   */
  public static calibrateFromDialogPayload(
    pixelDistance: number,
    realWorldDistanceMeters: number
  ): CalibrationResult {
    if (realWorldDistanceMeters <= 0 || pixelDistance <= 0) {
      throw new Error("Parameters must be greater than zero.");
    }

    // Convert meters to millimetres cleanly to line up with EF Core entity dimensions
    const referenceDistanceInMillimetres = realWorldDistanceMeters * 1000.0;
    const millimetresPerPixel = referenceDistanceInMillimetres / pixelDistance;

    return {
      millimetresPerPixel,
      pixelsPerMillimetre: 1 / millimetresPerPixel,
      referenceDistance: referenceDistanceInMillimetres
    };
  }

  /**
   * Converts image pixels to world millimetres.
   */
  public static pixelsToMillimetres(pixels: number, calibration: CalibrationResult): number {
    return pixels * calibration.millimetresPerPixel;
  }

  /**
   * Converts world millimetres to image pixels.
   */
  public static millimetresToPixels(millimetres: number, calibration: CalibrationResult): number {
    return millimetres * calibration.pixelsPerMillimetre;
  }

  /**
   * Converts an image point into world coordinates.
   */
  public static imageToWorld(point: Point2D, calibration: CalibrationResult): Point2D {
    return {
      x: point.x * calibration.millimetresPerPixel,
      y: point.y * calibration.millimetresPerPixel,
    };
  }

  /**
   * Converts a world coordinate into image space.
   */
  public static worldToImage(point: Point2D, calibration: CalibrationResult): Point2D {
    return {
      x: point.x * calibration.pixelsPerMillimetre,
      y: point.y * calibration.pixelsPerMillimetre,
    };
  }
}
