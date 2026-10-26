// src/modules/FloorPlanDesigner/Store/FloorPlanDocumentDto.ts

export interface FloorPlanDocumentDto {
  id: string;
  name: string;
  activeProjectId?: string;
  activeProjectName?: string;
  activeBuildingId?: string;
  activeBuildingName?: string;
  activeFloorId?: string;
  activeFloorName?: string;
  activeDocumentName?: string;
  drawnWallsJson?: string;
  definedRoomsJson?: string;
  placedFixturesJson?: string;
  createdAt?: string;
  lastModified?: string;
  version?: number;
}

export interface WallDto {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  thickness?: number;
  height?: number;
  material?: string;
  style?: any;
}

export interface DoorDto {
  id: string;
  wallId: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  doorType?: string;
  swing?: string;
  style?: any;
}

export interface WindowDto {
  id: string;
  wallId: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  transmittance?: number;
  style?: any;
}

export interface RoomDto {
  id: string;
  name: string;
  vertices: Array<{ x: number; y: number }>;
  targetLux?: number;
  spaceType?: string;
  area?: number;
  style?: any;
}

export interface ImportedDrawingDto {
  id: string;
  fileName: string;
  fileSize?: number;
  scaleFactor?: number;
  offsetX?: number;
  offsetY?: number;
  rotationDegrees?: number;
  opacity?: number;
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
}

export interface ElectricalFixtureDto {
  id: string;
  type: string;
  x: number;
  y: number;
  properties?: Record<string, any>;
}