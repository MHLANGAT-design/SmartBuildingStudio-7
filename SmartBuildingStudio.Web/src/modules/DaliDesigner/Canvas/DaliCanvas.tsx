// src/modules/DaliDesigner/Canvas/DaliCanvas.tsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAppSelector } from "@/store/hooks";

import { CanvasRenderer } from "@/modules/FloorPlanDesigner/Components/Canvas/CanvasRenderer";
import {
  computeViewTransform,
  computeBounds,
  type ViewTransform,
} from "@/modules/Shared/Canvas/Transform";

import {
  selectDevices,
  selectFloorplanModel,
  selectFloorplanStatus,
  selectFloorplanError,
  selectRawGeometry,
  selectLayerVisibility,
} from "@/modules/DaliDesigner/store/daliSelectors";

import { useDaliCanvasZoom } from "@/modules/DaliDesigner/hooks/useDaliCanvasZoom";
import { useDaliCanvasPan } from "@/modules/DaliDesigner/hooks/useDaliCanvasPan";
import { useDaliLockState } from "@/modules/DaliDesigner/hooks/useDaliLockState";

import { RoomLayer } from "./RoomLayer";
import { NetworkLayer } from "./NetworkLayer";
import { DeviceLayer } from "./DeviceLayer";
import { GroupLayer } from "./GroupLayer";
import { SceneLayer } from "./SceneLayer";
import { LineTopologyLayer } from "./LineTopologyLayer";
import { AddressMapLayer } from "./AddressMapLayer";
import { SignalFlowLayer } from "./SignalFlowLayer";
import { ValidationLayer } from "./ValidationLayer";
import { LayerManager } from "./LayerManager";

import { useZoomSurface } from "@/modules/Shared/Zoom/zoomRegistry";
import type { ZoomableSurface, WorldRect } from "@/modules/Shared/Zoom/zoomSurface";
import { usePanMode } from "@/modules/Shared/Zoom/panMode";

const MIN_BOUNDS_SPAN = 100;

const MOUSE_LEFT = 0;
const MOUSE_MIDDLE = 1;
const MOUSE_RIGHT = 2;

const ZOOM_MAX = 20;
const ZOOM_STEP = 0.15;

const DOUBLE_CLICK_ZOOM_FILL = 0.4;
const DOUBLE_CLICK_ZOOM_MAX = 4;
const DOUBLE_CLICK_DEVICE_HIT_PX = 24;
const DOUBLE_CLICK_DEVICE_BOX = 20;

export function DaliCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const transformRef = useRef<ViewTransform | null>(null);

  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  const {
    offset,
    setOffset,
    isPanning,
    handleMouseDown,
    handleMouseMove,
    handleMouseUpOrLeave,
  } = useDaliCanvasPan();
  const { scale, setZoom, handleWheel } = useDaliCanvasZoom();
  const panMode = usePanMode();

  const { isReadOnly, lockedByUsername } = useDaliLockState();

  const isMiddlePanningRef = useRef(false);
  const isSpacePanningRef = useRef(false);
  const isPanModePanningRef = useRef(false);
  const [isSpaceDown, setIsSpaceDown] = useState(false);

  const model = useAppSelector(selectFloorplanModel);
  const fpStatus = useAppSelector(selectFloorplanStatus);
  const fpError = useAppSelector(selectFloorplanError);
  const devices = useAppSelector(selectDevices);
  const rawGeometry = useAppSelector(selectRawGeometry);
  const layers = useAppSelector(selectLayerVisibility);

  const combinedModel = useMemo(() => {
    if (!model) return null;
    const elements = [...model.elements];
    if (layers.rawgeometry && rawGeometry.length > 0) {
      elements.push(...rawGeometry);
    }
    return { ...model, elements };
  }, [model, rawGeometry, layers.rawgeometry]);

  const zoomSurface = useMemo<ZoomableSurface>(() => ({
    moduleName: "DALI Designer",
    getZoom: () => scale,
    setZoom: (z: number) => { setZoom(z); },
    zoomIn: () => { setZoom(scale + ZOOM_STEP); },
    zoomOut: () => { setZoom(scale - ZOOM_STEP); },
    fitToContent: () => { setZoom(1); setOffset({ x: 0, y: 0 }); },
    zoomToRect: (rect: WorldRect, opts) => {
      const fill = opts?.fill ?? DOUBLE_CLICK_ZOOM_FILL;
      const maxZoom = opts?.maxZoom ?? DOUBLE_CLICK_ZOOM_MAX;
      const minZoom = opts?.minZoom ?? 0.5;

      const tf = transformRef.current;
      if (!tf) return;

      const worldW = Math.max(1e-6, rect.maxX - rect.minX);
      const worldH = Math.max(1e-6, rect.maxY - rect.minY);

      const currentZoom = scale || 1;
      const naturalScaleX = tf.finalScale / currentZoom;
      const naturalScaleY = Math.abs(tf.yScale) / currentZoom;
      if (!Number.isFinite(naturalScaleX) || !Number.isFinite(naturalScaleY)) return;
      if (naturalScaleX <= 0 || naturalScaleY <= 0) return;

      const zoomForW = (tf.width * fill) / (worldW * naturalScaleX);
      const zoomForH = (tf.height * fill) / (worldH * naturalScaleY);
      const rawTarget = Math.min(zoomForW, zoomForH);
      const targetZoom = Math.min(Math.max(rawTarget, minZoom), Math.min(maxZoom, ZOOM_MAX));
      if (!Number.isFinite(targetZoom) || targetZoom <= 0) return;

      const newFinalScale = naturalScaleX * targetZoom;
      const newYScale = CanvasRenderer.flipY ? -newFinalScale : newFinalScale;

      const worldCx = (rect.minX + rect.maxX) / 2;
      const worldCy = (rect.minY + rect.maxY) / 2;

      const newOffsetX = -(worldCx - tf.centerX) * newFinalScale;
      const newOffsetY = -(worldCy - tf.centerY) * newYScale;

      const dpr = window.devicePixelRatio || 1;
      setZoom(targetZoom);
      setOffset({ x: newOffsetX / dpr, y: newOffsetY / dpr });
    },
  }), [scale, setZoom, setOffset]);

  useZoomSurface(zoomSurface);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setCanvasSize({
        width: Math.max(200, Math.floor(rect.width)),
        height: Math.max(200, Math.floor(rect.height)),
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handler = (e: WheelEvent) =>
      handleWheel(e as unknown as React.WheelEvent<HTMLCanvasElement>);
    canvas.addEventListener("wheel", handler, { passive: false });
    return () => canvas.removeEventListener("wheel", handler);
  }, [handleWheel]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const active = document.activeElement as HTMLElement | null;
      if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable)) return;
      e.preventDefault();
      setIsSpaceDown(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      setIsSpaceDown(false);
      if (isSpacePanningRef.current) {
        isSpacePanningRef.current = false;
        handleMouseUpOrLeave();
      }
    };
    const onBlur = () => {
      setIsSpaceDown(false);
      if (isSpacePanningRef.current) {
        isSpacePanningRef.current = false;
        handleMouseUpOrLeave();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bounds = useMemo(() => {
    let b = { minX: -10000, minY: -10000, maxX: 10000, maxY: 10000 };
    const pts: Array<{ x: number; y: number }> = [];

    if (combinedModel) {
      for (const el of combinedModel.elements) {
        for (const p of el.points ?? []) {
          if (Number.isFinite(p.x) && Number.isFinite(p.y)) pts.push(p);
        }
      }
    }
    for (const d of devices) {
      if (d.metadata.position) pts.push(d.metadata.position);
    }
    if (pts.length > 0) b = computeBounds(pts, b);

    if (b.maxX - b.minX < MIN_BOUNDS_SPAN) {
      const cx = (b.minX + b.maxX) / 2;
      b.minX = cx - MIN_BOUNDS_SPAN / 2;
      b.maxX = cx + MIN_BOUNDS_SPAN / 2;
    }
    if (b.maxY - b.minY < MIN_BOUNDS_SPAN) {
      const cy = (b.minY + b.maxY) / 2;
      b.minY = cy - MIN_BOUNDS_SPAN / 2;
      b.maxY = cy + MIN_BOUNDS_SPAN / 2;
    }
    return b;
  }, [combinedModel, devices]);

  const tf: ViewTransform = useMemo(() => {
    return computeViewTransform({
      bounds,
      canvasWidth: canvasSize.width,
      canvasHeight: canvasSize.height,
      zoom: scale,
      offsetX: offset.x,
      offsetY: offset.y,
      padding: 60,
      flipY: true,
    });
  }, [bounds, scale, offset, canvasSize]);

  transformRef.current = tf;

  const pendingRef = useRef<number | null>(null);

  useEffect(() => {
    if (pendingRef.current != null) {
      cancelAnimationFrame(pendingRef.current);
      pendingRef.current = null;
    }

    const _model = combinedModel;
    const _canvasSize = canvasSize;
    const _scale = scale;
    const _offset = offset;
    const _rawVisible = layers.rawgeometry;

    pendingRef.current = requestAnimationFrame(() => {
      pendingRef.current = null;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = _canvasSize.width * dpr;
      canvas.height = _canvasSize.height * dpr;
      canvas.style.width = `${_canvasSize.width}px`;
      canvas.style.height = `${_canvasSize.height}px`;

      ctx.fillStyle = "#0A0A0A";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (!_model) return;

      try {
        const planLike = {
          elements: _model.elements as any[],
          walls: _model.walls as any[],
          doors: _model.doors as any[],
        };
        CanvasRenderer.flipY = true;
        CanvasRenderer.clearAndDraw(
          ctx,
          canvas.width,
          canvas.height,
          planLike as any,
          _scale,
          { x: _offset.x * dpr, y: _offset.y * dpr },
          {
            showDimensions: false,
            layers: {
              walls: true,
              doors: true,
              windows: true,
              rooms: true,
              rawgeometry: _rawVisible,
              fixtures: false,
              exitRoutes: false,
            },
            selectedId: null,
            hoveredId: null,
            flipY: true,
          }
        );
      } catch (err) {
        console.warn("[DaliCanvas] plan render failed:", err);
      }
    });

    return () => {
      if (pendingRef.current != null) {
        cancelAnimationFrame(pendingRef.current);
        pendingRef.current = null;
      }
    };
  }, [combinedModel, canvasSize, scale, offset, layers.rawgeometry]);

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === MOUSE_RIGHT) return;
    if (e.button === MOUSE_MIDDLE) {
      e.preventDefault();
      isMiddlePanningRef.current = true;
      handleMouseDown(e);
      return;
    }
    if (e.button === MOUSE_LEFT && isSpaceDown) {
      e.preventDefault();
      isSpacePanningRef.current = true;
      handleMouseDown(e);
      return;
    }
    if (e.button === MOUSE_LEFT && panMode) {
      e.preventDefault();
      isPanModePanningRef.current = true;
      handleMouseDown(e);
      return;
    }
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isMiddlePanningRef.current || isSpacePanningRef.current || isPanModePanningRef.current) {
      handleMouseMove(e);
      return;
    }
    if (isPanning) handleMouseMove(e);
  };

  const handlePointerUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isMiddlePanningRef.current = false;
    isSpacePanningRef.current = false;
    isPanModePanningRef.current = false;
    handleMouseUpOrLeave(e);
  };

  const handlePointerLeave = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isMiddlePanningRef.current = false;
    isSpacePanningRef.current = false;
    isPanModePanningRef.current = false;
    handleMouseUpOrLeave(e);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const tfNow = transformRef.current;
    if (!canvas || !tfNow) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const screenX = (e.clientX - rect.left) * dpr;
    const screenY = (e.clientY - rect.top) * dpr;

    let best: { x: number; y: number; dist: number } | null = null;
    for (const d of devices) {
      const pos = d.metadata.position;
      if (!pos) continue;
      const sx = tfNow.width / 2 + tfNow.offsetX + (pos.x - tfNow.centerX) * tfNow.finalScale;
      const sy = tfNow.height / 2 + tfNow.offsetY + (pos.y - tfNow.centerY) * tfNow.yScale;
      const dist = Math.hypot(sx - screenX, sy - screenY);
      if (!best || dist < best.dist) {
        best = { x: pos.x, y: pos.y, dist };
      }
    }

    const threshold = DOUBLE_CLICK_DEVICE_HIT_PX * dpr;
    if (best && best.dist <= threshold) {
      const R = DOUBLE_CLICK_DEVICE_BOX;
      zoomSurface.zoomToRect(
        { minX: best.x - R, maxX: best.x + R, minY: best.y - R, maxY: best.y + R },
        { fill: DOUBLE_CLICK_ZOOM_FILL, maxZoom: DOUBLE_CLICK_ZOOM_MAX }
      );
      return;
    }

    zoomSurface.fitToContent();
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
  };

  const cursorStyle = useMemo(() => {
    if (isMiddlePanningRef.current || isSpacePanningRef.current || isPanModePanningRef.current) {
      return "grabbing";
    }
    if (panMode || isSpaceDown) return "grab";
    if (isPanning) return "grabbing";
    if (isReadOnly) return "default";
    return "crosshair";
  }, [panMode, isSpaceDown, isPanning, isReadOnly]);

  return (
    <div
      ref={containerRef}
      className="dali-canvas"
      style={{
        position: "relative",
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        overflow: "hidden",
        background: "#0A0A0A",
      }}
    >
      {isReadOnly && (
        <div style={readOnlyBanner}>
          <span>🔒</span>
          <span>
            Read-only — locked by {lockedByUsername || "another user"}. Pan and zoom only.
          </span>
        </div>
      )}

      {fpStatus === "loading" && (
        <div style={statusOverlay}>Loading floorplan…</div>
      )}
      {fpStatus === "error" && (
        <div style={{ ...statusOverlay, color: "#ff7875" }}>
          Floorplan error: {fpError}
        </div>
      )}

      <canvas
        ref={canvasRef}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerLeave}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        style={{
          position: "absolute",
          inset: 0,
          display: "block",
          background: "#0A0A0A",
          cursor: cursorStyle,
          zIndex: 0,
        }}
      />

      <svg
        className="dali-overlays"
        width="100%"
        height="100%"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1,
        }}
      >
        <RoomLayer transform={tf} />
        <NetworkLayer transform={tf} />
        <DeviceLayer transform={tf} />
        <GroupLayer transform={tf} />
        <SceneLayer transform={tf} />
        <LineTopologyLayer transform={tf} />
        <AddressMapLayer transform={tf} />
        <SignalFlowLayer transform={tf} />
        <ValidationLayer transform={tf} />
      </svg>

      <LayerManager />
    </div>
  );
}

const readOnlyBanner: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  padding: "8px 12px",
  background: "rgba(255, 184, 0, 0.15)",
  borderBottom: "1px solid rgba(255, 184, 0, 0.4)",
  color: "#FFB800",
  fontSize: 10,
  fontFamily: "monospace",
  fontWeight: "bold",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  zIndex: 2,
  display: "flex",
  alignItems: "center",
  gap: 6,
  pointerEvents: "none",
};

const statusOverlay: React.CSSProperties = {
  position: "absolute",
  top: 8,
  left: 8,
  color: "#888",
  fontSize: 11,
  fontFamily: "monospace",
  pointerEvents: "none",
  zIndex: 2,
};

export default DaliCanvas;