// src/modules/FloorPlanDesigner/Canvas/Layers/LayerManager.ts
import { IRenderLayer } from "@/modules/FloorPlanDesigner/Canvas/Layers/IRenderLayer";

import { GridLayer } from "@/modules/FloorPlanDesigner/Canvas/Layers/GridLayer";
import { ImportedDrawingLayer } from "@/modules/FloorPlanDesigner/Canvas/Layers/ImportedDrawingLayer";
import { WallLayer } from "@/modules/FloorPlanDesigner/Canvas/Layers/WallLayer";
import { DoorLayer } from "@/modules/FloorPlanDesigner/Canvas/Layers/DoorLayer";
import { WindowLayer } from "@/modules/FloorPlanDesigner/Canvas/Layers/WindowLayer";
import { RoomLayer } from "@/modules/FloorPlanDesigner/Canvas/Layers/RoomLayer";

import { CoordinateHudLayer } from "@/modules/FloorPlanDesigner/Canvas/Layers/CoordinateHudLayer";

export class LayerManager {
  private readonly layers: IRenderLayer[] = [];

  // ── Singleton ────────────────────────────────────────────────────
  // The canvas and the sidebar must share one deck. Two decks would
  // mean the panel toggles one set of layers while the canvas paints
  // another — the exact class of bug this file exists to prevent.
  private static _instance: LayerManager | null = null;

  public static getInstance(): LayerManager {
    if (!LayerManager._instance) {
      LayerManager._instance = new LayerManager();
    }
    return LayerManager._instance;
  }

  private constructor() {
    console.log("[CAD Layer Engine]: Bootstrapping clean architectural canvas layers...");

    this.registerLayer(new GridLayer(), 0);
    this.registerLayer(new ImportedDrawingLayer(), 5);
    this.registerLayer(WallLayer.getInstance(), 10);
    this.registerLayer(new DoorLayer(), 20);
    this.registerLayer(new WindowLayer(), 30);
    this.registerLayer(new RoomLayer(), 40);
    this.registerLayer(new CoordinateHudLayer(), 999);
  }

  public registerLayer(layer: IRenderLayer, priorityZIndex: number = 0): void {
    if (!layer || typeof layer.getId !== "function") return;

    const existingIndex = this.layers.findIndex((l) => l.getId() === layer.getId());
    if (existingIndex !== -1) {
      this.layers[existingIndex] = layer;
      return;
    }

    (layer as any)._priorityZIndex = priorityZIndex;
    this.layers.push(layer);
    this.layers.sort((a, b) => ((a as any)._priorityZIndex || 0) - ((b as any)._priorityZIndex || 0));

    console.log(`[CAD Layer Manager]: Mounted layer '${layer.getId()}' @ priority ${priorityZIndex}`);
  }

  public findLayer(id: string): IRenderLayer | undefined {
    return this.layers.find((l) => l.getId() === id);
  }

  public getRenderLayers(): readonly IRenderLayer[] {
    return this.layers;
  }

  public clear(): void {
    this.layers.length = 0;
  }

  /**
   * Apply visibility to registered layers from a keyed map.
   *
   * `visibilityByPanelId` is keyed by the LayerExplorer row ids
   * (walls, doors, grid, imported, …). `deckIdToPanelId` translates
   * each layer's own getId() into that vocabulary; layers whose deck
   * id has no entry are left alone.
   *
   * Idempotent: a layer already in the target state is not touched, so
   * the panel's immediate write and the canvas's rehydration echo do
   * not fight.
   */
  public applyVisibility(
    visibilityByPanelId: Record<string, boolean>,
    deckIdToPanelId: Record<string, string>
  ): void {
    for (const layer of this.layers) {
      const panelId = deckIdToPanelId[layer.getId()];
      if (!panelId) continue;
      const next = visibilityByPanelId[panelId];
      if (typeof next !== "boolean") continue;
      if (layer.isVisible() !== next) {
        layer.setVisible(next);
      }
    }
  }
}

export default LayerManager;