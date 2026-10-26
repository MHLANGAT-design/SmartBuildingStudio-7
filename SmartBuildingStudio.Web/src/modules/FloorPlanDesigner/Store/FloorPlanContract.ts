/**
 * ============================================================================
 * Smart Building Studio
 * Canonical Floor Plan Contract
 * ============================================================================
 *
 * This file is the SINGLE SOURCE OF TRUTH for every floor plan.
 *
 * Every component must use this structure:
 *
 * SQL Database
 *        ↓
 * ASP.NET Controller
 *        ↓
 * API
 *        ↓
 * Redux
 *        ↓
 * DrawingDocument
 *        ↓
 * Canvas
 *
 * No legacy DrawnWallsJson
 * No DefinedRoomsJson
 * No PlacedFixturesJson
 *
 * Everything maps directly to this contract.
 * ============================================================================
 */

export interface PointDto {
    x: number;
    y: number;
}

export interface StyleDto {
    strokeColor: string;
    fillColor: string;
    strokeWidth: number;
    opacity: number;
}

export interface WallDto {
    id: string;

    start: PointDto;

    end: PointDto;

    thickness: number;

    height: number;

    material?: string;

    style?: StyleDto;
}

export interface DoorDto {
    id: string;

    wallId?: string;

    position: PointDto;

    width: number;

    swingAngle?: number;

    type?: string;

    style?: StyleDto;
}

export interface WindowDto {
    id: string;

    wallId?: string;

    position: PointDto;

    width: number;

    sillHeight?: number;

    style?: StyleDto;
}

export interface RoomDto {
    id: string;

    name: string;

    polygon: PointDto[];

    targetLux?: number;

    primaryGroup?: number;

    style?: StyleDto;
}

export interface ImportedDrawingDto {
    id: string;

    fileName: string;

    fileType?: string;

    offsetX: number;

    offsetY: number;

    scaleFactor: number;

    rotationDegrees: number;

    opacity: number;
}

export interface ElectricalFixtureDto {
    id: string;

    type: string;

    x: number;

    y: number;

    rotation: number;

    daliAddress?: number;

    group?: number;
}

export interface LayerDto {
    id: string;

    name: string;

    visible: boolean;

    locked: boolean;

    order: number;
}

export interface FloorDto {
    id: string;

    name: string;

    level: number;

    elevation: number;

    walls: WallDto[];

    doors: DoorDto[];

    windows: WindowDto[];

    rooms: RoomDto[];
}

export interface FloorPlanDocumentDto {
    id: string;

    name: string;

    activeProjectId?: string;

    activeBuildingId?: string;

    activeFloorId?: string;

    floors: FloorDto[];

    importedDrawings: ImportedDrawingDto[];

    electricalFixtures: ElectricalFixtureDto[];

    layers: LayerDto[];

    pixelsToMetresScale: number;

    createdUtc?: string;

    modifiedUtc?: string;
}