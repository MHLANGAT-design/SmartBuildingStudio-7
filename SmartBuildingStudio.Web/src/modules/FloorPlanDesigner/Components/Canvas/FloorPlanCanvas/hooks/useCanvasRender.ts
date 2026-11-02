// src/modules/FloorPlanDesigner/Components/Canvas/FloorPlanCanvas/hooks/useCanvasRender.ts
//
// The single render-loop hook. Owns the requestAnimationFrame frame,
// world-bounds calculation, the CanvasRenderer.clearAndDraw call, room
// overlays, multi-selection outlines, the drag-rect, the per-tool
// overlay, the snap indicator, and the LayerManager render pass.

import { useEffect } from 'react';
import { CanvasRenderer } from '@/modules/FloorPlanDesigner/Components/Canvas/CanvasRenderer';
import { getClosedLockPoint } from '@/modules/FloorPlanDesigner/core/types/Door.types';
import { SnapService } from '@/modules/FloorPlanDesigner/Utils/SnapService';
import { LayerManager } from '@/modules/FloorPlanDesigner/Canvas/LayerManager';
import { RenderContext } from '@/modules/FloorPlanDesigner/Canvas/RenderContext';
import type { ArchitecturalPlan } from '@/modules/FloorPlanDesigner/core/types';
import type { CanvasTransform } from '@/modules/FloorPlanDesigner/Components/Canvas/FloorPlanCanvas/types';
import {
  CANVAS_CSS_WIDTH,
  CANVAS_CSS_HEIGHT,
  EMPTY_WORLD_BOUNDS,
  FIT_PADDING_PX,
  TOOL_TO_LAYER_KEY,
} from '@/modules/FloorPlanDesigner/Components/Canvas/FloorPlanCanvas/constants';
import {
  calculateAreaFromPoints,
  makeViewport,
} from '@/modules/FloorPlanDesigner/Components/Canvas/FloorPlanCanvas/utils/geometry';

interface UseCanvasRenderArgs {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  transformRef: React.MutableRefObject<CanvasTransform | null>;
  renderPlan: ArchitecturalPlan;
  dataSource: any;
  scale: number;
  offset: { x: number; y: number };
  selection: any;
  multiSelection: string[];
  layers: Record<string, boolean>;
  snapResult: any;
  hoveredId: string | null;
  hoveredIdFromRedux: string | null;
  calibrationState: any;
  currentTool: string;
  dragTick: number;
  isDragRectRef: React.MutableRefObject<boolean>;
  dragStartWorldRef: React.MutableRefObject<{ x: number; y: number } | null>;
  dragCurrentWorldRef: React.MutableRefObject<{ x: number; y: number } | null>;
  lastFrameDocRef: React.MutableRefObject<string | null>;
  getActiveToolInstance: () => any;
  toolManager: any;
  toolContext: any;
  toolManagerKnowsTool: (toolId: string) => boolean;
}

export function useCanvasRender({
  canvasRef,
  transformRef,
  renderPlan,
  dataSource,
  scale,
  offset,
  selection,
  multiSelection,
  layers,
  snapResult,
  hoveredId,
  hoveredIdFromRedux,
  calibrationState,
  currentTool,
  dragTick,
  isDragRectRef,
  dragStartWorldRef,
  dragCurrentWorldRef,
  lastFrameDocRef,
  getActiveToolInstance,
  toolManager,
  toolContext,
  toolManagerKnowsTool,
}: UseCanvasRenderArgs): void {
  useEffect(() => {
    let cancelled = false;

    const frame = requestAnimationFrame(() => {
      if (cancelled) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = CANVAS_CSS_WIDTH * dpr;
      canvas.height = CANVAS_CSS_HEIGHT * dpr;
      canvas.style.width = `${CANVAS_CSS_WIDTH}px`;
      canvas.style.height = `${CANVAS_CSS_HEIGHT}px`;

      const frameDocId = (renderPlan as any)?.id ?? null;
      const frameElements = Array.isArray((renderPlan as any)?.elements)
        ? (renderPlan as any).elements.length
        : 0;
      if (lastFrameDocRef.current !== frameDocId) {
        console.log('[FloorPlanCanvas] render frame', {
          frameDocId,
          frameElements,
          dataSourceId: dataSource?.id ?? null,
          dataSourceElements: Array.isArray(dataSource?.elements)
            ? dataSource.elements.length
            : 0,
        });
        lastFrameDocRef.current = frameDocId;
      }

      const currentSelection = selection || (window as any).__currentSelection || null;
      const selectedId =
        (currentSelection?.id ?? currentSelection?.Id ?? null) as string | null;

      const multiSelectionSet = new Set(multiSelection || []);

      CanvasRenderer.flipY = true;

      // ── world bounds ──────────────────────────────────────────────
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      let hasPoints = false;

      renderPlan.elements.forEach((el) => {
        const pts = el.points || el.vertices || (el.start && el.end ? [el.start, el.end] : []);
        pts.forEach((pt: any) => {
          if (pt && typeof pt.x === 'number' && typeof pt.y === 'number') {
            if (pt.x < minX) minX = pt.x;
            if (pt.x > maxX) maxX = pt.x;
            if (pt.y < minY) minY = pt.y;
            if (pt.y > maxY) maxY = pt.y;
            hasPoints = true;
          }
        });
      });

      if (Array.isArray(renderPlan.doors)) {
        renderPlan.doors.forEach((d) => {
          const lock = getClosedLockPoint(d);
          [{ x: d.hingeX, y: d.hingeY }, lock].forEach((pt) => {
            if (pt.x < minX) minX = pt.x;
            if (pt.x > maxX) maxX = pt.x;
            if (pt.y < minY) minY = pt.y;
            if (pt.y > maxY) maxY = pt.y;
            hasPoints = true;
          });
        });
      }

      if (!hasPoints) {
        minX = EMPTY_WORLD_BOUNDS.minX;
        maxX = EMPTY_WORLD_BOUNDS.maxX;
        minY = EMPTY_WORLD_BOUNDS.minY;
        maxY = EMPTY_WORLD_BOUNDS.maxY;
      }
      const dxfWidth = maxX - minX || 1;
      const dxfHeight = maxY - minY || 1;
      const finalTotalScale =
        Math.min(
          (canvas.width - FIT_PADDING_PX) / dxfWidth,
          (canvas.height - FIT_PADDING_PX) / dxfHeight,
        ) * (scale || 1);
      const yScale = CanvasRenderer.flipY ? -finalTotalScale : finalTotalScale;

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      transformRef.current = {
        finalScale: finalTotalScale,
        yScale,
        centerX,
        centerY,
        width: canvas.width,
        height: canvas.height,
        offsetX: offset.x,
        offsetY: offset.y,
      };

      // ── base pass ─────────────────────────────────────────────────
      CanvasRenderer.clearAndDraw(
        ctx,
        canvas.width,
        canvas.height,
        renderPlan,
        scale,
        offset,
        {
          showDimensions: false,
          layers,
          selectedId,
          hoveredId,
        },
      );

      // ── room fills + labels ───────────────────────────────────────
      if (layers.rooms !== false) {
        ctx.save();
        ctx.translate(canvas.width / 2 + offset.x, canvas.height / 2 + offset.y);
        ctx.scale(finalTotalScale, yScale);
        ctx.translate(-centerX, -centerY);

        renderPlan.elements.forEach((element) => {
          if (!element) return;
          const type = String(element.type || '').toLowerCase();
          if (type !== 'room' && type !== 'rooms' && !element.isRoom) return;

          const pts = element.points || element.vertices || [];
          if (!Array.isArray(pts) || pts.length < 3) return;

          const elId = String(element.id ?? element.Id ?? '');
          const isSelected =
            (currentSelection &&
              (currentSelection.id === element.id || currentSelection.Id === element.id)) ||
            (elId && multiSelectionSet.has(elId));

          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
          ctx.closePath();

          ctx.fillStyle = isSelected
            ? 'rgba(5, 255, 196, 0.25)'
            : (element.fillStyle || 'rgba(74, 222, 128, 0.12)');
          ctx.fill();

          ctx.strokeStyle = isSelected
            ? '#05FFC4'
            : (element.strokeStyle || '#4ADE80');
          ctx.lineWidth = (isSelected ? 3 : 1.5) / finalTotalScale;
          ctx.setLineDash([]);
          ctx.stroke();
        });

        ctx.restore();

        renderPlan.elements.forEach((element) => {
          if (!element) return;
          const type = String(element.type || '').toLowerCase();
          if (type !== 'room' && type !== 'rooms' && !element.isRoom) return;

          const pts = element.points || element.vertices || [];
          if (!Array.isArray(pts) || pts.length < 3) return;

          const elId = String(element.id ?? element.Id ?? '');
          const isSelected =
            (currentSelection &&
              (currentSelection.id === element.id || currentSelection.Id === element.id)) ||
            (elId && multiSelectionSet.has(elId));

          let cx = 0, cy = 0;
          for (const p of pts) { cx += p.x; cy += p.y; }
          cx /= pts.length;
          cy /= pts.length;

          const screenCx = canvas.width / 2 + offset.x + (cx - centerX) * finalTotalScale;
          const screenCy = canvas.height / 2 + offset.y + (cy - centerY) * yScale;

          const roomSize = Math.sqrt(Math.abs(dxfWidth * dxfHeight));
          const fontSize = Math.max(10, Math.min(22, roomSize / 35));
          const lineHeight = fontSize * 1.2;

          const areaValue = calculateAreaFromPoints(pts);
          const roomName = element.name || 'Unnamed Room';

          ctx.fillStyle = isSelected ? '#05FFC4' : 'rgba(74, 222, 128, 0.95)';
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(roomName, screenCx, screenCy - lineHeight * 0.6);

          const luxValue = element.targetLux || element.lux || 500;
          const groupValue = element.primaryGroup || element.group || 1;
          ctx.fillStyle = isSelected ? 'rgba(5, 255, 196, 0.8)' : 'rgba(255, 255, 255, 0.6)';
          ctx.font = `${fontSize * 0.55}px sans-serif`;
          ctx.fillText(`${luxValue} lx  |  G${groupValue}`, screenCx, screenCy + lineHeight * 0.5);

          ctx.fillStyle = isSelected ? 'rgba(5, 255, 196, 0.6)' : 'rgba(255, 255, 255, 0.4)';
          ctx.font = `${fontSize * 0.45}px sans-serif`;
          ctx.fillText(`${areaValue.toFixed(2)} m²`, screenCx, screenCy + lineHeight * 1.3);
        });
      }

      // ── multi-selection outlines ──────────────────────────────────
      if (multiSelectionSet.size > 0) {
        ctx.save();
        ctx.translate(canvas.width / 2 + offset.x, canvas.height / 2 + offset.y);
        ctx.scale(finalTotalScale, yScale);
        ctx.translate(-centerX, -centerY);
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 3 / finalTotalScale;
        ctx.setLineDash([]);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (const element of renderPlan.elements) {
          if (!element) continue;
          const elId = String(element.id ?? element.Id ?? '');
          if (!elId || !multiSelectionSet.has(elId)) continue;

          const type = String(element.type || '').toLowerCase();
          if (type === 'room' || type === 'rooms' || element.isRoom) continue;

          const pts = element.points || element.vertices ||
            (element.start && element.end ? [element.start, element.end] : []);
          if (!Array.isArray(pts) || pts.length < 2) continue;

          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
          ctx.stroke();
        }
        ctx.restore();
      }

      // ── drag-rect ─────────────────────────────────────────────────
      if (
        isDragRectRef.current &&
        dragStartWorldRef.current &&
        dragCurrentWorldRef.current
      ) {
        const s = dragStartWorldRef.current;
        const c = dragCurrentWorldRef.current;
        const isCrossing = c.x < s.x;

        const screenS = {
          x: canvas.width / 2 + offset.x + (s.x - centerX) * finalTotalScale,
          y: canvas.height / 2 + offset.y + (s.y - centerY) * yScale,
        };
        const screenC = {
          x: canvas.width / 2 + offset.x + (c.x - centerX) * finalTotalScale,
          y: canvas.height / 2 + offset.y + (c.y - centerY) * yScale,
        };

        const rectX = Math.min(screenS.x, screenC.x);
        const rectY = Math.min(screenS.y, screenC.y);
        const rectW = Math.abs(screenC.x - screenS.x);
        const rectH = Math.abs(screenC.y - screenS.y);

        ctx.save();
        if (isCrossing) {
          ctx.fillStyle = 'rgba(74, 222, 128, 0.12)';
          ctx.strokeStyle = '#4ADE80';
          ctx.setLineDash([6, 4]);
        } else {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
          ctx.strokeStyle = '#38BDF8';
          ctx.setLineDash([]);
        }
        ctx.lineWidth = 1.5;
        ctx.fillRect(rectX, rectY, rectW, rectH);
        ctx.strokeRect(rectX, rectY, rectW, rectH);
        ctx.restore();
      }

      // ── per-tool overlay + ToolManager overlay ────────────────────
      const activeToolInstance = getActiveToolInstance();
      const viewportForTool = transformRef.current
        ? makeViewport(transformRef.current)
        : null;

      if (activeToolInstance && transformRef.current) {
        const toolLayerKey = TOOL_TO_LAYER_KEY[currentTool] ?? null;
        const shouldRenderOverlay =
          toolLayerKey === null || layers[toolLayerKey] !== false;

        if (shouldRenderOverlay && viewportForTool) {
          (activeToolInstance as any).viewport = viewportForTool;
          (activeToolInstance as any).context = { viewport: viewportForTool };
          (activeToolInstance as any).__document = renderPlan;
          if (typeof activeToolInstance.renderOverlay === 'function') {
            activeToolInstance.renderOverlay(ctx);
          }
        }
      } else if (toolManagerKnowsTool(currentTool) && toolManager) {
        // Shared ToolManager overlay. Forward viewport + document onto the
        // active tool so its renderOverlay can project world → screen.
        if (viewportForTool) (toolManager as any).viewport = viewportForTool;
        if (toolContext) (toolManager as any).context = toolContext;
        (toolManager as any).__document = renderPlan;

        const activeSharedTool =
          typeof toolManager.getActiveTool === 'function'
            ? toolManager.getActiveTool()
            : null;
        if (activeSharedTool) {
          if (viewportForTool) (activeSharedTool as any).viewport = viewportForTool;
          (activeSharedTool as any).__document = renderPlan;
        }

        if (typeof toolManager.renderOverlay === 'function') {
          toolManager.renderOverlay(ctx, {
            viewport: viewportForTool,
            document: renderPlan,
          });
        }
      }

      // ── snap indicator ────────────────────────────────────────────
      if (snapResult && snapResult.type !== null && viewportForTool) {
        SnapService.renderSnapIndicator(ctx, snapResult.point, snapResult.type, viewportForTool);
      }

      // ── LayerManager pass (calibration + preview) ─────────────────
      {
        const lm = LayerManager.getInstance();

        lm.applyVisibility(
          {
            calibration: layers.calibration !== false,
            preview: layers.preview !== false,
          },
          {
            calibration: 'calibration',
            preview: 'preview',
          },
        );

        const calLayer: any = lm.findLayer('calibration');
        if (calLayer && typeof calLayer.update === 'function') {
          calLayer.update({
            ...(calibrationState || {
              p1: null,
              p2: null,
              knownDistance: null,
              unit: 'mm',
              pxPerUnit: null,
            }),
            cursor: null,
          });
        }

        const prevLayer: any = lm.findLayer('preview');
        if (prevLayer && typeof prevLayer.update === 'function') {
          prevLayer.update({
            hoveredId: hoveredIdFromRedux ?? hoveredId ?? null,
            selectionId: selectedId,
            multiSelection: multiSelection || [],
          });
        }

        const viewportLike = viewportForTool
          ? { zoom: scale, offsetX: offset.x, offsetY: offset.y, ...viewportForTool }
          : null;
        if (!viewportLike) return;

        const docLike: any = {
          getElements: () => (renderPlan as any).elements || [],
          getWalls: () => (renderPlan as any).walls || [],
          getRooms: () => (renderPlan as any).rooms || [],
          getDoors: () => (renderPlan as any).doors || [],
          getWindows: () => (renderPlan as any).windows || [],
          getImportedDrawings: () => (renderPlan as any).importedDrawings || [],
        };

        const rc = new RenderContext(docLike, viewportLike);

        ctx.save();
        ctx.translate(canvas.width / 2 + offset.x, canvas.height / 2 + offset.y);
        ctx.scale(finalTotalScale, yScale);
        ctx.translate(-centerX, -centerY);

        for (const layer of lm.getRenderLayers()) {
          const id = layer.getId();
          if (id !== 'calibration' && id !== 'preview') continue;
          try {
            layer.render(ctx, rc);
          } catch (e) {
            console.warn(`[FloorPlanCanvas] layer '${id}' render failed`, e);
          }
        }

        ctx.restore();
      }
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [
    canvasRef,
    transformRef,
    renderPlan,
    dataSource,
    scale,
    offset,
    selection,
    multiSelection,
    layers,
    snapResult,
    hoveredId,
    hoveredIdFromRedux,
    calibrationState,
    currentTool,
    dragTick,
    isDragRectRef,
    dragStartWorldRef,
    dragCurrentWorldRef,
    lastFrameDocRef,
    getActiveToolInstance,
    toolManager,
    toolContext,
    toolManagerKnowsTool,
  ]);
}