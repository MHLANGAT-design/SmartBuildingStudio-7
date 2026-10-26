// src/modules/FixturePlacementStudio/Canvas/PlacementLayer.ts
//
// Placement mode tracking for the FixturePlacementStudio canvas.
//
// When the user has selected a product in the Fixture Library
// (state.fixture.placementProductId is set), clicking on the canvas
// commits a new fixture. This hook resolves the productId → FixtureKind
// mapping by fetching the product from ProductCatalogService.

import { useCallback, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { placeFixture } from '@/modules/FixturePlacementStudio/store/fixtureSlice';
import { selectPlacementProductId } from '@/modules/FixturePlacementStudio/store/fixtureSelectors';
import type { FixtureKind } from '@/modules/FixturePlacementStudio/models/Fixture';
import { API_ROUTES } from '@/Application/ApiRoutes';

export interface PlacementCursor {
  worldX: number;
  worldY: number;
}

export interface UsePlacementLayerResult {
  productId: string | null;
  cursor: PlacementCursor | null;
  isActive: boolean;
  setCursor: (world: PlacementCursor | null) => void;
  commit: (world: PlacementCursor, roomId?: string) => void;
}

// ─── Wire DTO ────────────────────────────────────────────────────────────────
//
// Mirrors ProductCatalogService.Application.DTOs.ProductDto.
// `productType` is a STRING — the backend serializes the enum by name.

interface ProductDto {
  id: string;
  productCode: string;
  name: string;
  productType: string;
  wattage?: number | null;
  lumens?: number | null;
  cri?: number | null;
  colorTemperature?: number | null;
  manufacturer?: string | null;
}

/**
 * Map a ProductCatalogService `productType` string onto a studio
 * `FixtureKind`. Mirrors the same mapping used in FixtureLibrary so
 * both stay in sync.
 *
 * Backend enum (ProductCatalogService.Domain.Enums.ProductType):
 *   "Luminaire"     → 'luminaire'
 *   "Driver"        → 'driver'
 *   "Controller"    → 'controller'
 *   "Sensor"        → 'sensor'
 *   "Gateway"       → 'gateway'
 *   "EmergencyUnit" → 'emergencyLight'
 *   "PowerSupply"   → 'powerSupply'
 *   "Switch"        → 'switch'
 */
function mapProductTypeToKind(productType: string): FixtureKind {
  switch (productType) {
    case 'Luminaire':     return 'luminaire';
    case 'Driver':        return 'driver';
    case 'Controller':    return 'controller';
    case 'Sensor':        return 'sensor';
    case 'Gateway':       return 'gateway';
    case 'EmergencyUnit': return 'emergencyLight';
    case 'PowerSupply':   return 'powerSupply';
    case 'Switch':        return 'switch';
    default:
      // eslint-disable-next-line no-console
      console.warn(`[PlacementLayer] Unknown productType "${productType}", defaulting to luminaire`);
      return 'luminaire';
  }
}

/**
 * Per-product kind cache. Populated on the first placement of a given
 * product so subsequent placements don't re-fetch. Bounded by the number
 * of distinct products in the catalog — safe to keep for the lifetime of
 * the module.
 */
const productKindCache = new Map<string, FixtureKind>();

/**
 * Default mounting height for newly placed fixtures, in meters.
 *
 * Photometric calculations assume fixtures are above the work plane
 * (typically 0.8 m for offices). A fixture placed at elevation 0 sits
 * inside the floor and contributes nothing meaningful. 2.8 m matches
 * a standard ceiling.
 */
const DEFAULT_ELEVATION_METERS = 2.8;

export function usePlacementLayer(): UsePlacementLayerResult {
  const dispatch = useAppDispatch();
  const productId = useAppSelector(selectPlacementProductId);
  const [cursor, setCursorState] = useState<PlacementCursor | null>(null);
  const cursorRef = useRef<PlacementCursor | null>(null);

  const setCursor = useCallback((world: PlacementCursor | null) => {
    cursorRef.current = world;
    setCursorState(world);
  }, []);

  const commit = useCallback(
    (world: PlacementCursor, roomId?: string) => {
      if (!productId) return;

      // Cache hit — synchronous path.
      const cachedKind = productKindCache.get(productId);
      if (cachedKind) {
        dispatch(
          placeFixture({
            kind: cachedKind,
            productId,
            x: world.worldX,
            y: world.worldY,
            rotation: 0,
            roomId,
            elevation: DEFAULT_ELEVATION_METERS,
          })
        );
        return;
      }

      // Cache miss — resolve the kind asynchronously, then place.
      const pid = productId;
      const wx = world.worldX;
      const wy = world.worldY;
      const rid = roomId;

      (async () => {
        try {
          const url = API_ROUTES.PRODUCT_CATALOG_SERVICE.PRODUCTS.GET(pid);
          const res = await fetch(url, {
            method: 'GET',
            headers: { Accept: 'application/json' },
          });

          if (!res.ok) {
            throw new Error(`HTTP ${res.status} ${res.statusText}`);
          }

          const dto = (await res.json()) as ProductDto;
          const kind = mapProductTypeToKind(dto.productType);
          productKindCache.set(pid, kind);

          dispatch(
            placeFixture({
              kind,
              productId: pid,
              x: wx,
              y: wy,
              rotation: 0,
              roomId: rid,
              elevation: DEFAULT_ELEVATION_METERS,
            })
          );
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn(
            `[PlacementLayer] Failed to resolve kind for productId "${pid}", defaulting to luminaire.`,
            err
          );
          // Fallback: place as a luminaire so the user isn't left with
          // a silent no-op. The glyph will be wrong but the fixture
          // exists and can be corrected later.
          productKindCache.set(pid, 'luminaire');
          dispatch(
            placeFixture({
              kind: 'luminaire',
              productId: pid,
              x: wx,
              y: wy,
              rotation: 0,
              roomId: rid,
              elevation: DEFAULT_ELEVATION_METERS,
            })
          );
        }
      })();
    },
    [dispatch, productId]
  );

  return {
    productId: productId ?? null,
    cursor,
    isActive: !!productId,
    setCursor,
    commit,
  };
}

export default usePlacementLayer;