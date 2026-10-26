// src/modules/FixturePlacementStudio/Sidebar/FixtureLibrary.tsx
//
// Fixture library, sourced from ProductCatalogService.
//
// Fetches the product list from GET /api/productcatalog/products and
// renders each as a selectable item. Clicking one sets
// state.fixture.placementProductId, which puts the canvas into placement
// mode. Clicking the active one clears it.
//
// Colors and glyphs come from the shared fixtureKindVisuals module so
// the library and the canvas stay in sync.

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { setPlacementProduct } from '@/modules/FixturePlacementStudio/store/fixtureSlice';
import { selectPlacementProductId } from '@/modules/FixturePlacementStudio/store/fixtureSelectors';
import type { FixtureKind } from '@/modules/FixturePlacementStudio/models/Fixture';
import { API_ROUTES } from '@/Application/ApiRoutes';
import {
  KIND_COLORS,
  KIND_GLYPH,
} from '@/modules/FixturePlacementStudio/constants/fixtureKindVisuals';

// ─── Wire DTO ────────────────────────────────────────────────────────────────
//
// Mirrors ProductCatalogService.Application.DTOs.ProductDto.
// Note: `productType` is a STRING — the backend projects the enum's
// name (e.g. "Luminaire", "Sensor"), not its numeric value.

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

// ─── Presentation types ──────────────────────────────────────────────────────

interface LibraryProduct {
  productId: string;
  name: string;
  kind: FixtureKind;
  description: string;
}

/**
 * Map a ProductCatalogService `productType` string onto a studio
 * `FixtureKind`.
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
 *
 * The backend's JsonStringEnumConverter serializes the enum by name.
 * Matching is case-sensitive by design so a future enum rename surfaces
 * here rather than silently mapping.
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
      console.warn(`[FixtureLibrary] Unknown productType "${productType}", defaulting to luminaire`);
      return 'luminaire';
  }
}

/**
 * Build a one-line description from the product's specs.
 * Falls back to the product code if no specs are present.
 */
function buildDescription(p: ProductDto): string {
  const bits: string[] = [];
  if (p.wattage != null) bits.push(`${p.wattage}W`);
  if (p.lumens != null) bits.push(`${p.lumens}lm`);
  if (p.colorTemperature != null) bits.push(`${p.colorTemperature}K`);
  if (bits.length > 0) return bits.join(' · ');
  return p.productCode || '';
}

// ─── Component ───────────────────────────────────────────────────────────────

export const FixtureLibrary: React.FC = () => {
  const dispatch = useAppDispatch();
  const placementProductId = useAppSelector(selectPlacementProductId);

  const [products, setProducts] = useState<LibraryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch the catalog once on mount ────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      setLoading(true);
      setError(null);

      try {
        const url = API_ROUTES.PRODUCT_CATALOG_SERVICE.PRODUCTS.LIST;
        const res = await fetch(url, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status} ${res.statusText}`);
        }

        const dtos = (await res.json()) as ProductDto[];

        if (cancelled) return;

        const mapped: LibraryProduct[] = dtos.map((p) => ({
          productId: p.id,
          name: p.name,
          kind: mapProductTypeToKind(p.productType),
          description: buildDescription(p),
        }));

        setProducts(mapped);
      } catch (err: any) {
        if (cancelled) return;
        // eslint-disable-next-line no-console
        console.error('[FixtureLibrary] Failed to load catalog:', err);
        setError(err?.message ?? 'Failed to load catalog');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleClick = (productId: string) => {
    if (placementProductId === productId) {
      dispatch(setPlacementProduct(null));
    } else {
      dispatch(setPlacementProduct(productId));
    }
  };

  return (
    <div style={wrap}>
      <div style={header}>Fixture Library</div>
      <div style={subtext}>
        {loading
          ? 'Loading catalog…'
          : error
            ? 'Catalog unavailable.'
            : 'Click a product to enter placement mode. Click again to exit.'}
      </div>

      {error && (
        <div style={errorBox}>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
            Could not load catalog
          </div>
          <div style={{ fontSize: 9, color: '#FCA5A5' }}>{error}</div>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div style={emptyBox}>
          No products in the catalog yet.
          <br />
          <span style={{ color: '#475569' }}>
            Add products via the ProductCatalogService API or seed the database.
          </span>
        </div>
      )}

      <div style={list}>
        {products.map((product) => {
          const selected = placementProductId === product.productId;
          return (
            <button
              key={product.productId}
              type="button"
              onClick={() => handleClick(product.productId)}
              title={product.name}
              style={{
                ...row,
                borderColor: selected ? KIND_COLORS[product.kind] : '#1E293B',
                background: selected ? 'rgba(56, 189, 248, 0.08)' : '#0B0F19',
              }}
            >
              <div
                style={{
                  ...glyph,
                  background: KIND_COLORS[product.kind],
                }}
              >
                {KIND_GLYPH[product.kind]}
              </div>
              <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                <div style={productName}>{product.name}</div>
                <div style={productDesc}>{product.description}</div>
              </div>
            </button>
          );
        })}
      </div>

      {placementProductId && (
        <div style={activeHint}>
          Placement mode active — click on the canvas to place.
        </div>
      )}
    </div>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const wrap: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  width: '100%',
};

const header: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 'bold',
  color: '#38BDF8',
  letterSpacing: 0.5,
  textTransform: 'uppercase',
};

const subtext: React.CSSProperties = {
  fontSize: 10,
  color: '#64748B',
  lineHeight: 1.4,
};

const list: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  marginTop: 4,
};

const row: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 8px',
  border: '1px solid #1E293B',
  borderRadius: 4,
  cursor: 'pointer',
  color: '#E2E8F0',
  fontFamily: 'inherit',
  fontSize: 10,
  transition: 'background 0.1s, border-color 0.1s',
};

const glyph: React.CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: '50%',
  color: '#0A0A0A',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold',
  fontSize: 11,
  flexShrink: 0,
};

const productName: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: '#E2E8F0',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const productDesc: React.CSSProperties = {
  fontSize: 9,
  color: '#64748B',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const activeHint: React.CSSProperties = {
  marginTop: 6,
  padding: '6px 8px',
  background: 'rgba(56, 189, 248, 0.08)',
  border: '1px solid rgba(56, 189, 248, 0.3)',
  borderRadius: 4,
  fontSize: 9,
  color: '#7DD3FC',
  lineHeight: 1.4,
};

const errorBox: React.CSSProperties = {
  padding: '8px 10px',
  background: 'rgba(239, 68, 68, 0.08)',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  borderRadius: 4,
  fontSize: 10,
  color: '#FCA5A5',
};

const emptyBox: React.CSSProperties = {
  padding: '10px',
  background: 'rgba(148, 163, 184, 0.05)',
  border: '1px dashed #334155',
  borderRadius: 4,
  fontSize: 10,
  color: '#94A3B8',
  lineHeight: 1.5,
  textAlign: 'center',
};

export default FixtureLibrary;