// src/modules/FloorPlanDesigner/Canvas/Layers/DoorLayer.tsx

import { IRenderLayer } from "@/modules/FloorPlanDesigner/Canvas/Layers/IRenderLayer";
import { RenderContext } from "@/modules/FloorPlanDesigner/Canvas/RenderContext";

/**
 * DoorLayer — visibility façade for the door rendering pass.
 *
 * Architectural note:
 *   CanvasRenderer.clearAndDraw() is the SINGLE authority that actually paints
 *   door primitives (step 7) and filters raw DXF door-layer geometry (step 6).
 *   This layer therefore does NOT render anything itself — its render() is a
 *   deliberate no-op to avoid duplicate drawing, dashed-arc conflicts, and
 *   color mismatches.
 *
 *   What this layer DOES own is the *visibility toggle* API surface. When
 *   setVisible() is called (e.g. by a layer panel, keyboard shortcut, or a
 *   LayerManager-driven toggle), it forwards the change through three
 *   synchronized channels so that whichever rendering path is active picks
 *   it up:
 *
 *     1. Redux dispatch  → floorPlan/setLayerVisibility({ doors })
 *        Primary source of truth. FloorPlanCanvas reads this via useAppSelector
 *        and passes it down into CanvasRenderer via RenderOptions.layers.
 *
 *     2. window.__hiddenLayersMap
 *        Defensive fallback for toggles that bypass Redux (legacy code paths,
 *        imperatively-driven layer panels, dev-tools manipulation). Read by
 *        CanvasRenderer.isLayerVisible() as a secondary check.
 *
 *     3. canvas-invalidate event
 *        Forces FloorPlanCanvas to re-run its render effect immediately,
 *        even when no Redux change was observed (e.g. if dispatch was a no-op
 *        because the value was already set, or if Redux wasn't wired).
 *
 *   The three channels are idempotent and cheap, so it's safe to fire all
 *   of them on every toggle.
 */
export class DoorLayer implements IRenderLayer {
  private visible = true;

  public getId(): string {
    return "doors";
  }

  public getName(): string {
    return "Doors";
  }

  public isVisible(): boolean {
    return this.visible;
  }

  public setVisible(visible: boolean): void {
    // Normalize to a strict boolean — callers may pass truthy/falsy values.
    const next = Boolean(visible);

    // Fast-path: no change, no work.
    if (this.visible === next) return;
    this.visible = next;

    // ── Channel 1: Redux (primary source of truth) ─────────────────────────
    try {
      const dispatch = (window as any).__floorPlanDispatch;
      if (typeof dispatch === 'function') {
        dispatch({
          type: 'floorPlan/setLayerVisibility',
          payload: { doors: next },
        });
      }
    } catch (err) {
      // Non-fatal: fall through to the other channels so visibility still flips.
      console.warn('[DoorLayer] Redux dispatch failed, using fallback channels:', err);
    }

    // ── Channel 2: window.__hiddenLayersMap (fallback) ─────────────────────
    try {
      const existing = (window as any).__hiddenLayersMap;
      const map: Record<string, boolean> =
        existing && typeof existing === 'object' ? { ...existing } : {};

      if (next) {
        // Visible → clear both plural and singular keys.
        delete map['doors'];
        delete map['door'];
      } else {
        // Hidden → set both plural and singular keys so any reader matches.
        map['doors'] = true;
        map['door'] = true;
      }

      (window as any).__hiddenLayersMap = map;
    } catch (err) {
      console.warn('[DoorLayer] hidden-map fallback update failed:', err);
    }

    // ── Channel 3: force a redraw ──────────────────────────────────────────
    try {
      window.dispatchEvent(new CustomEvent('canvas-invalidate'));
    } catch {
      // CustomEvent may be unavailable in exotic environments; ignore.
    }
  }

  // 🚀 NEW: Required by IRenderLayer. Renders above walls (10), below windows (30).
  public getZIndex(): number {
    return 20;
  }

  /**
   * Deliberate no-op.
   *
   * CanvasRenderer.clearAndDraw() step 7 renders doors exclusively, using
   * DoorData + the domain geometry helpers in Door.types.ts. Rendering here
   * as well would double-draw the leaf, arc, and hinge pivot with potentially
   * different styling, producing visual artifacts.
   *
   * If door rendering is ever migrated into this layer, remember to:
   *   - remove step 7 from CanvasRenderer.clearAndDraw()
   *   - remove the isDoorElement short-circuit from step 6
   *   - pass the same layers/selection/hover state through RenderContext
   */
  public render(_context: CanvasRenderingContext2D, _renderContext: RenderContext): void {
    return;
  }
}

export default DoorLayer;