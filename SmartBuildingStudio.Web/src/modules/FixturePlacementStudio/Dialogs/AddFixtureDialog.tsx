// src/modules/FixturePlacementStudio/Dialogs/AddFixtureDialog.tsx
//
// Two-step modal for choosing a fixture to place. Kind tile selection
// filters the product list on the right. Manufacturer and family
// dropdowns (shown only when the current kind has ≥2 of each) further
// narrow the list. Choosing a product and clicking Place commits.
//
// Products, manufacturers, and families all come from CatalogApi.
// All three are fetched in parallel each time the dialog opens.
// The fetch runs on every open (no cross-mount cache) — see the
// effect comment for why that's the correct design here.

import React, { useEffect, useMemo, useState } from 'react';
import { useAppDispatch } from '@/Application/ConfigureStore';
import { setPlacementProduct } from '@/modules/FixturePlacementStudio/store/fixtureSlice';
import type { FixtureKind } from '@/modules/FixturePlacementStudio/models/Fixture';
import {
  CatalogApi,
  CatalogApiError,
  type ProductDto,
} from '@/modules/FixturePlacementStudio/services/CatalogApi';
import {
  KIND_COLORS,
  KIND_GLYPH,
  KIND_LABELS,
} from '@/modules/FixturePlacementStudio/constants/fixtureKindVisuals';

// ─── Internal model ─────────────────────────────────────────────────────────

interface DialogProduct {
  productId: string;
  name: string;
  kind: FixtureKind;
  description: string;
  manufacturer: string;
  family: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
      console.warn(
        `[AddFixtureDialog] Unknown productType "${productType}", defaulting to luminaire`
      );
      return 'luminaire';
  }
}

function buildDescription(p: ProductDto): string {
  const bits: string[] = [];
  if (p.wattage > 0) bits.push(`${p.wattage}W`);
  if (p.lumens > 0) bits.push(`${p.lumens}lm`);
  if (p.colorTemperature > 0) bits.push(`${p.colorTemperature}K`);
  if (bits.length > 0) return bits.join(' · ');
  return p.productCode || '';
}

const KIND_ORDER: FixtureKind[] = [
  'luminaire',
  'emergencyLight',
  'sensor',
  'switch',
  'controller',
  'gateway',
  'driver',
  'powerSupply',
];

export interface AddFixtureDialogProps {
  open: boolean;
  onClose: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const AddFixtureDialog: React.FC<AddFixtureDialogProps> = ({
  open,
  onClose,
}) => {
  const dispatch = useAppDispatch();

  const [products, setProducts] = useState<DialogProduct[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [families, setFamilies] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedKind, setSelectedKind] = useState<FixtureKind | null>(null);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('');
  const [selectedFamily, setSelectedFamily] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // ── Fetch products + manufacturers + families on open ────────────
  //
  // Three requests in parallel. Runs on every open (no cross-mount
  // cache) to avoid the StrictMode double-invoke bug that leaves the
  // dialog stuck on "Loading…".
  //
  // Note: `listProducts` now takes an optional ProductFilters object
  // as its first argument (Phase 2 unified query layer). Passing
  // `undefined` means "no filters — fetch everything", which is what
  // we want here; filtering is done client-side across the loaded set.
  useEffect(() => {
    if (!open) return;

    const ctrl = new AbortController();
    setLoading(true);
    setError(null);

    Promise.all([
      CatalogApi.listProducts(undefined, ctrl.signal),
      CatalogApi.listManufacturers(ctrl.signal),
      CatalogApi.listFamilies(ctrl.signal),
    ])
      .then(([dtos, mfrs, fams]) => {
        if (ctrl.signal.aborted) return;
        const mapped: DialogProduct[] = dtos.map((p) => ({
          productId: p.id,
          name: p.name,
          kind: mapProductTypeToKind(p.productType),
          description: buildDescription(p),
          manufacturer: p.manufacturer ?? '',
          family: p.family ?? '',
        }));
        setProducts(mapped);
        setManufacturers(mfrs);
        setFamilies(fams);
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        // eslint-disable-next-line no-console
        console.error('[AddFixtureDialog] Failed to load catalog:', err);
        setError(
          err instanceof CatalogApiError
            ? `Catalog error ${err.status}: ${err.message}`
            : err?.message ?? 'Failed to load catalog'
        );
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });

    return () => ctrl.abort();
  }, [open]);

  // ── Reset state on close ─────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      setSelectedKind(null);
      setSelectedManufacturer('');
      setSelectedFamily('');
      setSelectedProductId(null);
    }
  }, [open]);

  const availableKinds = useMemo(() => {
    const present = new Set(products.map((p) => p.kind));
    return KIND_ORDER.filter((k) => present.has(k));
  }, [products]);

  // ── Manufacturers present for the selected kind ───────────────────
  const availableManufacturers = useMemo(() => {
    if (!selectedKind) return manufacturers;
    const present = new Set(
      products
        .filter((p) => p.kind === selectedKind)
        .map((p) => p.manufacturer)
        .filter((m) => m.length > 0)
    );
    return manufacturers.filter((m) => present.has(m));
  }, [manufacturers, products, selectedKind]);

  // ── Families present for the selected kind + manufacturer ────────
  const availableFamilies = useMemo(() => {
    if (!selectedKind) return families;
    return families.filter((f) =>
      products.some(
        (p) =>
          p.kind === selectedKind &&
          p.family.toLowerCase() === f.toLowerCase() &&
          (!selectedManufacturer ||
            p.manufacturer.toLowerCase() ===
              selectedManufacturer.toLowerCase())
      )
    );
  }, [families, products, selectedKind, selectedManufacturer]);

  // ── Final product filter ─────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    if (!selectedKind) return [];
    return products.filter((p) => {
      if (p.kind !== selectedKind) return false;
      if (
        selectedManufacturer &&
        p.manufacturer.toLowerCase() !== selectedManufacturer.toLowerCase()
      ) {
        return false;
      }
      if (
        selectedFamily &&
        p.family.toLowerCase() !== selectedFamily.toLowerCase()
      ) {
        return false;
      }
      return true;
    });
  }, [products, selectedKind, selectedManufacturer, selectedFamily]);

  // ── Escape closes ─────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  if (!open) return null;

  const canPlace = !!selectedProductId;

  const handlePlace = () => {
    if (!selectedProductId) return;
    dispatch(setPlacementProduct(selectedProductId));
    onClose();
  };

  const handleKindSelect = (k: FixtureKind) => {
    setSelectedKind(k);
    setSelectedManufacturer((prev) =>
      prev &&
      !products.some(
        (p) =>
          p.kind === k &&
          p.manufacturer.toLowerCase() === prev.toLowerCase()
      )
        ? ''
        : prev
    );
    setSelectedFamily((prev) =>
      prev &&
      !products.some(
        (p) => p.kind === k && p.family.toLowerCase() === prev.toLowerCase()
      )
        ? ''
        : prev
    );
    setSelectedProductId(null);
  };

  const handleManufacturerSelect = (m: string) => {
    setSelectedManufacturer(m);
    setSelectedFamily((prev) =>
      prev &&
      selectedKind &&
      !products.some(
        (p) =>
          p.kind === selectedKind &&
          p.family.toLowerCase() === prev.toLowerCase() &&
          (!m || p.manufacturer.toLowerCase() === m.toLowerCase())
      )
        ? ''
        : prev
    );
    setSelectedProductId(null);
  };

  return (
    <div style={backdrop} onClick={onClose}>
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        <div style={header}>
          <span>Add fixture</span>
          <button type="button" onClick={onClose} style={closeButton}>
            ✕
          </button>
        </div>

        <div style={body}>
          <div style={leftPane}>
            <div style={paneLabel}>Kind</div>
            {loading && <div style={muted}>Loading…</div>}
            {error && <div style={errorText}>{error}</div>}
            {!loading && !error && availableKinds.length === 0 && (
              <div style={muted}>No products in the catalog.</div>
            )}
            <div style={kindGrid}>
              {availableKinds.map((k) => {
                const active = selectedKind === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => handleKindSelect(k)}
                    style={{
                      ...kindTile,
                      borderColor: active ? KIND_COLORS[k] : '#1E293B',
                      background: active
                        ? 'rgba(56, 189, 248, 0.08)'
                        : '#0B0F19',
                    }}
                  >
                    <span style={{ ...kindGlyph, background: KIND_COLORS[k] }}>
                      {KIND_GLYPH[k]}
                    </span>
                    <span style={kindLabel}>{KIND_LABELS[k]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={rightPane}>
            <div style={paneLabel}>
              {selectedKind ? KIND_LABELS[selectedKind] : 'Product'}
            </div>

            {selectedKind && availableManufacturers.length > 1 && (
              <select
                value={selectedManufacturer}
                onChange={(e) => handleManufacturerSelect(e.target.value)}
                style={filterSelect}
                aria-label="Filter by manufacturer"
              >
                <option value="">All manufacturers</option>
                {availableManufacturers.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            )}

            {selectedKind && availableFamilies.length > 1 && (
              <select
                value={selectedFamily}
                onChange={(e) => {
                  setSelectedFamily(e.target.value);
                  setSelectedProductId(null);
                }}
                style={filterSelect}
                aria-label="Filter by family"
              >
                <option value="">All families</option>
                {availableFamilies.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            )}

            {!selectedKind && (
              <div style={muted}>Pick a kind on the left.</div>
            )}

            {selectedKind && filteredProducts.length === 0 && (
              <div style={muted}>No products match this filter.</div>
            )}

            {selectedKind && filteredProducts.length > 0 && (
              <div style={productList}>
                {filteredProducts.map((p) => {
                  const active = selectedProductId === p.productId;
                  const meta = [p.description, p.manufacturer, p.family]
                    .filter((s) => s && s.length > 0)
                    .join(' · ');
                  return (
                    <button
                      key={p.productId}
                      type="button"
                      onClick={() => setSelectedProductId(p.productId)}
                      style={{
                        ...productRow,
                        borderColor: active ? KIND_COLORS[p.kind] : '#1E293B',
                        background: active
                          ? 'rgba(56, 189, 248, 0.08)'
                          : '#0B0F19',
                      }}
                    >
                      <span
                        style={{ ...kindGlyph, background: KIND_COLORS[p.kind] }}
                      >
                        {KIND_GLYPH[p.kind]}
                      </span>
                      <div style={productText}>
                        <div style={productName}>{p.name}</div>
                        <div style={productDesc}>{meta}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div style={footer}>
          <button type="button" onClick={onClose} style={buttonGhost}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePlace}
            disabled={!canPlace}
            style={{
              ...buttonPrimary,
              opacity: canPlace ? 1 : 0.4,
              cursor: canPlace ? 'pointer' : 'not-allowed',
            }}
          >
            Place
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const backdrop: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.6)',
  zIndex: 9000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const panel: React.CSSProperties = {
  width: 720,
  maxWidth: '92vw',
  height: 480,
  maxHeight: '88vh',
  background: '#0F172A',
  border: '1px solid #1E293B',
  borderRadius: 8,
  boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  fontFamily: 'monospace',
  color: '#E2E8F0',
};

const header: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 14px',
  background: '#0B0F19',
  borderBottom: '1px solid #1E293B',
  fontSize: 11,
  fontWeight: 'bold',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#7DD3FC',
};

const closeButton: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#94A3B8',
  fontSize: 14,
  cursor: 'pointer',
  padding: '0 4px',
};

const body: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  minHeight: 0,
};

const leftPane: React.CSSProperties = {
  width: 260,
  borderRight: '1px solid #1E293B',
  padding: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  overflowY: 'auto',
};

const rightPane: React.CSSProperties = {
  flex: 1,
  padding: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  overflowY: 'auto',
  minWidth: 0,
};

const paneLabel: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 'bold',
  color: '#475569',
  letterSpacing: 1,
  textTransform: 'uppercase',
};

const kindGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 6,
};

const kindTile: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 10px',
  border: '1px solid #1E293B',
  borderRadius: 4,
  color: '#E2E8F0',
  fontFamily: 'inherit',
  fontSize: 10,
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'background 0.1s, border-color 0.1s',
};

const kindGlyph: React.CSSProperties = {
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

const kindLabel: React.CSSProperties = {
  fontSize: 10,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const filterSelect: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  background: '#0B0F19',
  border: '1px solid #1E293B',
  borderRadius: 4,
  color: '#E2E8F0',
  fontFamily: 'monospace',
  fontSize: 11,
  cursor: 'pointer',
};

const productList: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const productRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '8px 10px',
  border: '1px solid #1E293B',
  borderRadius: 4,
  cursor: 'pointer',
  color: '#E2E8F0',
  fontFamily: 'inherit',
  textAlign: 'left',
  transition: 'background 0.1s, border-color 0.1s',
};

const productText: React.CSSProperties = { flex: 1, minWidth: 0 };

const productName: React.CSSProperties = {
  fontSize: 11,
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

const muted: React.CSSProperties = {
  fontSize: 10,
  color: '#64748B',
  padding: '8px 0',
};

const errorText: React.CSSProperties = {
  fontSize: 10,
  color: '#FCA5A5',
  padding: '6px 8px',
  background: 'rgba(239, 68, 68, 0.08)',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  borderRadius: 4,
};

const footer: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
  padding: '10px 14px',
  background: '#0B0F19',
  borderTop: '1px solid #1E293B',
};

const buttonGhost: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: 4,
  border: '1px solid #334155',
  background: 'transparent',
  color: '#94A3B8',
  cursor: 'pointer',
  fontFamily: 'monospace',
  fontSize: 11,
  fontWeight: 'bold',
};

const buttonPrimary: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: 4,
  border: '1px solid #10B981',
  background: 'rgba(16, 185, 129, 0.15)',
  color: '#6EE7B7',
  fontFamily: 'monospace',
  fontSize: 11,
  fontWeight: 'bold',
};

export default AddFixtureDialog;