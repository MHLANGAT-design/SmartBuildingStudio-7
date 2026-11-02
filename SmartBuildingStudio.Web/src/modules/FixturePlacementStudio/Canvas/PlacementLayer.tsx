// src/modules/FixturePlacementStudio/Canvas/PlacementLayer.tsx

import { useCallback, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { placeFixture } from '@/modules/FixturePlacementStudio/store/fixtureSlice';
import { selectPlacementProductId } from '@/modules/FixturePlacementStudio/store/fixtureSelectors';
import type { FixtureKind } from '@/modules/FixturePlacementStudio/models/Fixture';
import type { EmergencyLight } from '@/modules/FixturePlacementStudio/models/EmergencyLight';
import { buildEmergencyLightFromProduct } from '@/modules/EmergencyLighting/utils/buildEmergencyLightFromProduct';
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
  family?: string | null;
  specifications?: string | null;
}

interface ResolvedProduct {
  kind: FixtureKind;
  emergencyLight?: EmergencyLight;
}

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
      console.warn(`[PlacementLayer] Unknown productType "${productType}", defaulting to luminaire`);
      return 'luminaire';
  }
}

const productResolvedCache = new Map<string, ResolvedProduct>();
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

  const dispatchPlace = useCallback(
    (resolved: ResolvedProduct, pid: string, wx: number, wy: number, rid?: string) => {
      dispatch(
        placeFixture({
          kind: resolved.kind,
          productId: pid,
          x: wx,
          y: wy,
          rotation: 0,
          roomId: rid,
          elevation: DEFAULT_ELEVATION_METERS,
          emergencyLight: resolved.emergencyLight,
        })
      );
    },
    [dispatch]
  );

  const commit = useCallback(
    (world: PlacementCursor, roomId?: string) => {
      if (!productId) return;

      const cached = productResolvedCache.get(productId);
      if (cached) {
        dispatchPlace(cached, productId, world.worldX, world.worldY, roomId);
        return;
      }

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
          if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

          const dto = (await res.json()) as ProductDto;
          const kind = mapProductTypeToKind(dto.productType);

          let emergencyLight: EmergencyLight | undefined = undefined;
          if (kind === 'emergencyLight') {
            try {
              emergencyLight = buildEmergencyLightFromProduct(dto);
            } catch (mapperErr) {
              console.error('[PlacementLayer] buildEmergencyLightFromProduct threw:', mapperErr);
              emergencyLight = undefined;
            }
          }

          const resolved: ResolvedProduct = { kind, emergencyLight };
          productResolvedCache.set(pid, resolved);
          dispatchPlace(resolved, pid, wx, wy, rid);
        } catch (err) {
          console.warn('[PlacementLayer] FAILED to resolve product', pid, '— falling back to luminaire. Error:', err);
          const fallback: ResolvedProduct = { kind: 'luminaire' };
          productResolvedCache.set(pid, fallback);
          dispatchPlace(fallback, pid, wx, wy, rid);
        }
      })();
    },
    [dispatchPlace, productId]
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