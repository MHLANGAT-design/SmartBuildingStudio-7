// Location: C:\Users\Tif\Documents\Smart Building Studio\SmartBuildingStudio.Web\src\modules\FloorPlanDesigner\Services\ValidationService.ts
import { DrawingDocument } from "@/modules/FloorPlanDesigner/Document/DrawingDocument";
import { Wall } from "@/modules/FloorPlanDesigner/Models/Wall";
import { Door } from "@/modules/FloorPlanDesigner/Models/Door";
import { Window } from "@/modules/FloorPlanDesigner/Models/Window";
import { GeometryService } from "@/modules/FloorPlanDesigner/Services/Geometry/GeometryService";
import { WallHitTestService } from "@/modules/FloorPlanDesigner/Services/Geometry/WallHitTestService";

export enum ValidationSeverity {
  Info = "info",
  Warning = "warning",
  Error = "error",
}

export interface ValidationIssue {
  severity: ValidationSeverity;
  message: string;
  objectId?: string;
}

export class ValidationService {
  /**
   * Validates the complete drawing document for systemic integrity.
   * Supports both plain data object nodes and native Document class instances.
   */
  public static validate(document: DrawingDocument | any): ValidationIssue[] {
    if (!document) return [];

    // 🚀 FIXED: Dynamic fallbacks intercept plain data object structures safely
    const walls = typeof document.getWalls === "function" ? document.getWalls() : (document.walls || []);
    const doors = typeof document.getDoors === "function" ? document.getDoors() : (document.doors || []);
    const windows = typeof document.getWindows === "function" ? document.getWindows() : (document.windows || []);

    return [
      ...this.validateWalls(walls),
      ...this.validateDoors(doors, walls),
      ...this.validateWindows(windows, walls),
    ];
  }

  private static validateWalls(walls: readonly Wall[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    if (!walls || !Array.isArray(walls)) return issues;

    for (const wall of walls) {
      if (!wall) continue;
      
      // Support start/end vectors from both plain JSON coordinates and Class properties
      const startPoint = wall.start || { x: wall.startX, y: wall.startY };
      const endPoint = wall.end || { x: wall.endX, y: wall.endY };

      if (!startPoint || !endPoint) continue;

      const lenSq = GeometryService.distanceSquared(startPoint, endPoint);
      const epsilonSq = GeometryService.EPSILON * GeometryService.EPSILON;

      if (lenSq < epsilonSq) {
        issues.push({
          severity: ValidationSeverity.Error,
          message: "Wall has zero length.",
          objectId: wall.id || wall.guid,
        });
      }
    }
    return issues;
  }

  private static validateDoors(doors: readonly Door[], walls: readonly Wall[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    if (!doors || !Array.isArray(doors)) return issues;
    
    const validWalls = Array.isArray(walls) ? walls : [];

    if (validWalls.length === 0) {
      return doors.map(door => ({
        severity: ValidationSeverity.Warning,
        message: "Door is not attached to a wall.",
        objectId: door?.id || door?.guid,
      }));
    }

    for (const door of doors) {
      if (!door) continue;
      const targetPos = door.position || door.start || { x: door.x, y: door.y };
      
      if (!targetPos || !WallHitTestService.hitTestWalls(targetPos, validWalls, 1).hit) {
        issues.push({
          severity: ValidationSeverity.Warning,
          message: "Door is not attached to a wall.",
          objectId: door.id || door.guid,
        });
      }
    }
    return issues;
  }

  private static validateWindows(windows: readonly Window[], walls: readonly Wall[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    if (!windows || !Array.isArray(windows)) return issues;

    const validWalls = Array.isArray(walls) ? walls : [];

    if (validWalls.length === 0) {
      return windows.map(window => ({
        severity: ValidationSeverity.Warning,
        message: "Window is not attached to a wall.",
        objectId: window?.id || window?.guid,
      }));
    }

    for (const window of windows) {
      if (!window) continue;
      const targetPos = window.position || window.start || { x: window.x, y: window.y };

      if (!targetPos || !WallHitTestService.hitTestWalls(targetPos, validWalls, 1).hit) {
        issues.push({
          severity: ValidationSeverity.Warning,
          message: "Window is not attached to a wall.",
          objectId: window.id || window.guid,
        });
      }
    }
    return issues;
  }
}
