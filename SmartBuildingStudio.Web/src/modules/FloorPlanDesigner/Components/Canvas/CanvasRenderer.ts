// src/modules/FloorPlanDesigner/Components/Canvas/CanvasRenderer.ts
import type { ArchitecturalPlan } from '@/modules/FloorPlanDesigner/core/types';
import {
  DoorData,
  getClosedLockPoint,
  getOpenLockPoint,
  getDoorArcParams,
} from '@/modules/FloorPlanDesigner/core/types/Door.types';
import {
  isComposite,
  drawComposite,
} from '@/modules/FloorPlanDesigner/core/composite/ElementComposer';

export interface ViewportTransform {
  scale: number;
  offset: { x: number; y: number };
  flipY?: boolean;
}

export interface RenderOptions {
  showGrid?: boolean;
  gridSize?: number;
  showDimensions?: boolean;
  selectedId?: string | null;
  hoveredId?: string | null;
  flipY?: boolean;
  layers?: Record<string, boolean | string>;
}

export class CanvasRenderer {
  public static flipY = true;

  private static readonly SELECTION_COLOR = '#FACC15';
  private static readonly SELECTION_GLOW_COLOR = 'rgba(250, 204, 21, 0.35)';
  private static readonly HOVER_COLOR = '#60A5FA';

  private static readonly WALL_COLOR = '#64748B';
  private static readonly DOOR_COLOR = '#F59E0B';
  private static readonly WINDOW_COLOR = '#38BDF8';
  private static readonly RAW_GEOMETRY_COLOR = '#475569';

  public static clearAndDraw(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    plan: ArchitecturalPlan,
    scale: number,
    offset: { x: number; y: number },
    options: RenderOptions = {}
  ): void {
    const {
      showGrid = true,
      gridSize = 50,
      showDimensions = true,
      selectedId = null,
      hoveredId = null,
      layers = {},
    } = options;

    // ── Phase 1: clear background ──────────────────────────────────────
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0B0F19';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    if (!plan) return;

    const allElements: any[] = Array.isArray(plan.elements) ? plan.elements : [];

    // ── Phase 2: bounding box over all elements ───────────────────────
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    let hasPoints = false;

    const doors: DoorData[] = plan.doors || [];

    const processPoint = (pt: { x: number; y: number }) => {
      if (pt && typeof pt.x === 'number' && typeof pt.y === 'number') {
        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.y > maxY) maxY = pt.y;
        hasPoints = true;
      }
    };

    allElements.forEach((el) => {
      const pts =
        el.points ||
        el.vertices ||
        (el.start && el.end ? [el.start, el.end] : []);
      if (Array.isArray(pts)) pts.forEach(processPoint);
      if (typeof (el as any).x === 'number' && typeof (el as any).y === 'number') {
        processPoint({ x: (el as any).x, y: (el as any).y });
      }
    });

    doors.forEach((d) => processPoint({ x: d.hingeX, y: d.hingeY }));

    if (!hasPoints) {
      minX = -1000; maxX = 1000; minY = -1000; maxY = 1000;
    }

    const dxfWidth = maxX - minX || 1;
    const dxfHeight = maxY - minY || 1;
    const finalScale =
      Math.min((width - 120) / dxfWidth, (height - 120) / dxfHeight) * (scale || 1);
    const useFlipY = options.flipY ?? this.flipY;
    const yScale = useFlipY ? -finalScale : finalScale;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // ── Phase 3: grid ──────────────────────────────────────────────────
    if (showGrid) {
      this.drawCadGrid(ctx, width, height, finalScale, offset, gridSize);
    }

    // ── Layer visibility resolution ────────────────────────────────────
    const areDoorsVisible = this.isLayerVisible('doors', layers);
    const areWallsVisible = this.isLayerVisible('walls', layers);
    const areWindowsVisible = this.isLayerVisible('windows', layers);
    const areFixturesVisible = this.isLayerVisible('fixtures', layers);
    const areRoomsVisible = this.isLayerVisible('rooms', layers);
    const areRawVisible = this.isLayerVisible('rawgeometry', layers);

    // ── Phase 4: apply world transform ─────────────────────────────────
    ctx.save();
    ctx.translate(width / 2 + offset.x, height / 2 + offset.y);
    ctx.scale(finalScale, yScale);
    ctx.translate(-centerX, -centerY);

    const worldLineWidth = Math.max(1.5 / finalScale, 1.0);

    // ── Phase 5: iterate every element ─────────────────────────────────
    type Batch = {
      strokeStyle: string;
      lineWidth: number;
      elements: any[];
    };
    const batchMap = new Map<string, Batch>();

    for (const element of allElements) {
      if (!element) continue;

      if (isComposite(element)) {
        const rawType = String(element.type || '').toLowerCase();
        if (rawType === 'door' && !areDoorsVisible) continue;
        if (rawType === 'window' && !areWindowsVisible) continue;
        if (rawType === 'wall' && !areWallsVisible) continue;

        const isSelected = selectedId !== null && element.id === selectedId;
        const isHovered =
          !isSelected && hoveredId !== null && element.id === hoveredId;

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (isSelected) {
          ctx.strokeStyle = CanvasRenderer.SELECTION_GLOW_COLOR;
          ctx.lineWidth = worldLineWidth * 6;
          drawComposite(ctx, element);

          ctx.strokeStyle = CanvasRenderer.SELECTION_COLOR;
          ctx.lineWidth = worldLineWidth * 2.5;
          drawComposite(ctx, element);
        } else if (isHovered) {
          ctx.strokeStyle = CanvasRenderer.HOVER_COLOR;
          ctx.lineWidth = worldLineWidth * 2;
          drawComposite(ctx, element);
        } else {
          const defaultColor =
            rawType === 'door'
              ? CanvasRenderer.DOOR_COLOR
              : rawType === 'window'
              ? CanvasRenderer.WINDOW_COLOR
              : CanvasRenderer.WALL_COLOR;
          ctx.strokeStyle = (element as any).strokeStyle || defaultColor;
          ctx.lineWidth = worldLineWidth;
          drawComposite(ctx, element);
        }

        ctx.restore();
        continue;
      }

      const rawType = String(element.type || '').toLowerCase();
      const rawLayer = String(
        element.layer || element.originalLayer || element.Layer || element.OriginalLayer || ''
      ).toLowerCase();

      const normalizedType = rawType.replace(/[_\s-]/g, '');
      const isFixtureElement =
        normalizedType === 'fixture' ||
        normalizedType === 'fixtures' ||
        normalizedType === 'electricalfixture' ||
        normalizedType === 'electricalfixtures' ||
        normalizedType === 'luminaire' ||
        normalizedType === 'light' ||
        rawLayer === 'fixtures' ||
        rawLayer === 'fixture' ||
        (typeof (element as any).kind === 'string' &&
          (element as any).kind.length > 0 &&
          (element as any).startX === undefined &&
          (element as any).hingeX === undefined &&
          (element as any).isRoom !== true);

      if (isFixtureElement) {
        if (!areFixturesVisible) continue;

        const ptsArray = Array.isArray(element.points)
          ? element.points
          : Array.isArray((element as any).vertices)
          ? (element as any).vertices
          : [];

        const ptFromPoints =
          ptsArray.length > 0
            ? { x: Number(ptsArray[0].x), y: Number(ptsArray[0].y) }
            : null;

        const ptFromXY =
          Number.isFinite((element as any).x) && Number.isFinite((element as any).y)
            ? { x: Number((element as any).x), y: Number((element as any).y) }
            : null;

        const pt = ptFromPoints ?? ptFromXY;
        if (!pt || !Number.isFinite(pt.x) || !Number.isFinite(pt.y)) continue;

        const kind = String(
          (element as any).kind ?? (element as any).fixtureType ?? 'luminaire'
        );
        const color = this.fixtureColorForKind(kind);
        const isSelected = selectedId !== null && element.id === selectedId;
        const isHovered =
          !isSelected && hoveredId !== null && element.id === hoveredId;

        const glyphRadius = 7 / finalScale;
        const ringRadius = 12 / finalScale;
        const outlineWidth = 1.5 / finalScale;

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, ringRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
        ctx.fill();

        if (isSelected) {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, ringRadius * 1.6, 0, 2 * Math.PI);
          ctx.strokeStyle = CanvasRenderer.SELECTION_GLOW_COLOR;
          ctx.lineWidth = outlineWidth * 4;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, glyphRadius, 0, 2 * Math.PI);
        ctx.fillStyle = isSelected ? CanvasRenderer.SELECTION_COLOR : color;
        ctx.fill();

        const letter = this.fixtureLetterForKind(kind);
        if (letter) {
          const letterSize = Math.max(glyphRadius * 1.4, 8 / finalScale);
          ctx.save();
          ctx.translate(pt.x, pt.y);
          if (useFlipY) ctx.scale(1, -1);
          ctx.font = `700 ${letterSize}px system-ui, -apple-system, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#0B0F19';
          ctx.fillText(letter, 0, 0);
          ctx.restore();
        }

        ctx.strokeStyle = '#0B0F19';
        ctx.lineWidth = outlineWidth;
        ctx.stroke();

        if (isHovered) {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, ringRadius * 1.4, 0, 2 * Math.PI);
          ctx.strokeStyle = CanvasRenderer.HOVER_COLOR;
          ctx.lineWidth = outlineWidth * 2;
          ctx.stroke();
        }

        continue;
      }

      if (
        rawType === 'room' ||
        rawType === 'rooms' ||
        (element as any).isRoom === true
      ) {
        if (!areRoomsVisible) continue;

        const pts = element.points || (element as any).vertices || [];
        if (!Array.isArray(pts) || pts.length < 3) continue;

        const isSelected = selectedId !== null && element.id === selectedId;

        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.closePath();

        ctx.fillStyle =
          (element as any).fillStyle ||
          (isSelected ? 'rgba(5, 255, 196, 0.25)' : 'rgba(74, 222, 128, 0.15)');
        ctx.fill();

        ctx.strokeStyle =
          (element as any).strokeStyle || (isSelected ? '#05FFC4' : '#4ADE80');
        ctx.lineWidth = isSelected ? 3.5 / finalScale : 1.5 / finalScale;
        ctx.stroke();
        continue;
      }

      if (
        normalizedType === 'rawgeometry' ||
        normalizedType === 'raw' ||
        rawType === 'raw_geometry'
      ) {
        if (!areRawVisible) continue;

        const pts =
          element.points ||
          (element as any).vertices ||
          (element.start && element.end ? [element.start, element.end] : []);
        if (!Array.isArray(pts) || pts.length < 2) continue;

        const isSelected = selectedId !== null && element.id === selectedId;
        const isHovered =
          !isSelected && hoveredId !== null && element.id === hoveredId;

        if (isSelected || isHovered) {
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);

          if (isSelected) {
            ctx.strokeStyle = CanvasRenderer.SELECTION_GLOW_COLOR;
            ctx.lineWidth = worldLineWidth * 8;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
          }

          ctx.strokeStyle = isSelected
            ? CanvasRenderer.SELECTION_COLOR
            : CanvasRenderer.HOVER_COLOR;
          ctx.lineWidth = isSelected ? worldLineWidth * 3 : worldLineWidth * 2;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
          continue;
        }

        const key = `${CanvasRenderer.RAW_GEOMETRY_COLOR}|${worldLineWidth}`;
        let batch = batchMap.get(key);
        if (!batch) {
          batch = {
            strokeStyle: CanvasRenderer.RAW_GEOMETRY_COLOR,
            lineWidth: worldLineWidth,
            elements: [],
          };
          batchMap.set(key, batch);
        }
        batch.elements.push(element);
        continue;
      }

      const isDoorElement =
        rawType.includes('door') ||
        rawLayer.includes('door') ||
        rawLayer === 'dr' ||
        rawLayer.startsWith('dr-') ||
        rawLayer.endsWith('-dr');

      const isWindowElement =
        !isDoorElement &&
        (rawType.includes('window') ||
          rawLayer.includes('window') ||
          rawLayer.includes('glaz') ||
          rawLayer.includes('sash'));

      const isWallElement = !isDoorElement && !isWindowElement;

      if (isDoorElement && !areDoorsVisible) continue;
      if (isWindowElement && !areWindowsVisible) continue;
      if (isWallElement && !areWallsVisible) continue;

      const pts =
        element.points ||
        (element as any).vertices ||
        (element.start && element.end ? [element.start, element.end] : []);
      if (!Array.isArray(pts) || pts.length < 2) continue;

      const isSelected = selectedId !== null && element.id === selectedId;
      const isHovered =
        !isSelected && hoveredId !== null && element.id === hoveredId;

      const elementStroke =
        (element as any).strokeStyle ||
        (isWindowElement
          ? CanvasRenderer.WINDOW_COLOR
          : isDoorElement
          ? CanvasRenderer.DOOR_COLOR
          : CanvasRenderer.WALL_COLOR);

      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);

        if (isSelected) {
          ctx.strokeStyle = CanvasRenderer.SELECTION_GLOW_COLOR;
          ctx.lineWidth = worldLineWidth * 8;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        }

        ctx.strokeStyle = isSelected
          ? CanvasRenderer.SELECTION_COLOR
          : CanvasRenderer.HOVER_COLOR;
        ctx.lineWidth = isSelected ? worldLineWidth * 3 : worldLineWidth * 2;
        ctx.stroke();
        continue;
      }

      const rawLineWidth =
        isWallElement && (element as any).thickness
          ? (element as any).thickness / 10
          : worldLineWidth;

      const lineWidth = Math.round(rawLineWidth * 10) / 10;

      const key = `${elementStroke}|${lineWidth}`;
      let batch = batchMap.get(key);
      if (!batch) {
        batch = { strokeStyle: elementStroke, lineWidth, elements: [] };
        batchMap.set(key, batch);
      }
      batch.elements.push(element);
    }

    // ── Phase 6: flush batches ─────────────────────────────────────────
    for (const batch of batchMap.values()) {
      if (batch.elements.length === 0) continue;

      ctx.strokeStyle = batch.strokeStyle;
      ctx.lineWidth = batch.lineWidth;
      ctx.lineCap = 'square';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (const element of batch.elements) {
        const pts =
          element.points ||
          (element as any).vertices ||
          (element.start && element.end ? [element.start, element.end] : []);
        if (!Array.isArray(pts) || pts.length < 2) continue;
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();
    }

    // ── Phase 7: dimensions ────────────────────────────────────────────
    if (showDimensions && areWallsVisible) {
      const walls = plan.walls || [];
      if (walls.length > 0) {
        this.drawWallDimensions(ctx, walls, worldLineWidth, useFlipY);
      }
    }

    // ── Phase 8: restore ctx ───────────────────────────────────────────
    ctx.restore();
  }

  private static isLayerVisible(
    layerKey: string,
    layers: Record<string, boolean | string>
  ): boolean {
    const reduxValue = layers?.[layerKey];
    if (reduxValue !== undefined && reduxValue !== null) {
      if (typeof reduxValue === 'boolean') return reduxValue;
      if (typeof reduxValue === 'string')
        return reduxValue.toLowerCase() !== 'false';
    }

    const hiddenMap =
      (typeof window !== 'undefined' ? (window as any).__hiddenLayersMap : null) ||
      {};

    if (hiddenMap[layerKey] === true) return false;
    if (layerKey === 'doors' && hiddenMap['door'] === true) return false;
    if (layerKey === 'walls' && hiddenMap['wall'] === true) return false;
    if (layerKey === 'windows' && hiddenMap['window'] === true) return false;
    if (layerKey === 'rooms' && hiddenMap['room'] === true) return false;
    if (layerKey === 'fixtures' && hiddenMap['fixture'] === true) return false;
    if (layerKey === 'rawgeometry' && hiddenMap['rawgeometry'] === true) return false;

    return true;
  }

  private static drawCadGrid(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    scale: number,
    offset: { x: number; y: number },
    gridSize: number
  ): void {
    const scaledGrid = gridSize * scale;
    if (scaledGrid < 5) return;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1;

    const startX = (width / 2 + offset.x) % scaledGrid;
    const startY = (height / 2 + offset.y) % scaledGrid;

    ctx.beginPath();
    for (let x = startX; x < width; x += scaledGrid) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = startY; y < height; y += scaledGrid) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  private static fixtureColorForKind(kind: string): string {
    const k = String(kind).toLowerCase().replace(/[_\s-]/g, '');
    switch (k) {
      case 'luminaire':
      case 'light':
      case 'ledpanel':
      case 'downlight':
        return '#FACC15';
      case 'emergencylight':
      case 'emergency':
      case 'emergencyunit':
        return '#EF4444';
      case 'sensor':
      case 'presence':
      case 'movementsensor':
      case 'occupancysensor':
        return '#FB923C';
      case 'gateway':
        return '#A855F7';
      case 'switch':
        return '#22D3EE';
      case 'driver':
        return '#818CF8';
      case 'powersupply':
        return '#FB7185';
      case 'controller':
        return '#34D399';
      default:
        return '#94A3B8';
    }
  }

  private static fixtureLetterForKind(kind: string): string | null {
    const k = String(kind).toLowerCase().replace(/[_\s-]/g, '');
    switch (k) {
      case 'luminaire':
      case 'light':
      case 'ledpanel':
      case 'downlight':
        return 'L';
      case 'emergencylight':
      case 'emergency':
      case 'emergencyunit':
        return 'E';
      case 'sensor':
      case 'presence':
      case 'movementsensor':
      case 'occupancysensor':
        return 'S';
      case 'gateway':
        return 'G';
      case 'switch':
        return 'W';
      case 'driver':
        return 'D';
      case 'powersupply':
        return 'P';
      case 'controller':
        return 'C';
      default:
        return null;
    }
  }

  private static drawDoorPrimitive(
    ctx: CanvasRenderingContext2D,
    door: DoorData,
    baseLineWidth: number,
    isSelected: boolean,
    isHovered: boolean
  ): void {
    const closedPoint = getClosedLockPoint(door);
    const openPoint = getOpenLockPoint(door);
    const arc = getDoorArcParams(door);

    ctx.save();

    let strokeColor = door.style?.strokeColor || CanvasRenderer.DOOR_COLOR;
    let lineWidth = baseLineWidth * (door.style?.strokeWidth || 1.5);

    if (isSelected) {
      strokeColor = CanvasRenderer.SELECTION_COLOR;
      lineWidth = baseLineWidth * 3;
    } else if (isHovered) {
      strokeColor = CanvasRenderer.HOVER_COLOR;
      lineWidth = baseLineWidth * 2;
    }

    ctx.beginPath();
    ctx.setLineDash([baseLineWidth * 2, baseLineWidth * 2]);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.lineWidth = baseLineWidth;
    ctx.moveTo(door.hingeX, door.hingeY);
    ctx.lineTo(closedPoint.x, closedPoint.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.moveTo(door.hingeX, door.hingeY);
    ctx.lineTo(openPoint.x, openPoint.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = isSelected ? CanvasRenderer.SELECTION_COLOR : strokeColor;
    ctx.arc(door.hingeX, door.hingeY, baseLineWidth * 2.5, 0, 2 * Math.PI);
    ctx.fill();

    ctx.beginPath();
    ctx.setLineDash([baseLineWidth * 1.5, baseLineWidth * 1.5]);
    ctx.strokeStyle = isSelected
      ? CanvasRenderer.SELECTION_COLOR
      : 'rgba(56, 189, 248, 0.6)';
    ctx.lineWidth = baseLineWidth;
    ctx.arc(
      arc.hinge.x,
      arc.hinge.y,
      arc.radius,
      arc.startAngle,
      arc.endAngle,
      arc.counterclockwise
    );
    ctx.stroke();

    ctx.restore();
  }

  private static drawWallDimensions(
    ctx: CanvasRenderingContext2D,
    walls: any[],
    baseLineWidth: number,
    flipY: boolean
  ): void {
    ctx.save();
    ctx.font = `${Math.max(10, baseLineWidth * 8)}px monospace`;
    ctx.fillStyle = '#94A3B8';
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
    ctx.lineWidth = baseLineWidth * 0.75;

    walls.forEach((wall) => {
      const sX = wall.startX ?? wall.start?.x ?? 0;
      const sY = wall.startY ?? wall.start?.y ?? 0;
      const eX = wall.endX ?? wall.end?.x ?? 0;
      const eY = wall.endY ?? wall.end?.y ?? 0;

      const length = Math.hypot(eX - sX, eY - sY);
      if (length < 10) return;

      const midX = (sX + eX) / 2;
      const midY = (sY + eY) / 2;

      ctx.save();
      ctx.translate(midX, midY);
      if (flipY) ctx.scale(1, -1);
      ctx.fillText(`${Math.round(length)} mm`, 5, -5);
      ctx.restore();
    });

    ctx.restore();
  }
}

export default CanvasRenderer;