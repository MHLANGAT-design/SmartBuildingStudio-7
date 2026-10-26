// src/modules/Admin/ManufacturerAdminPage.tsx
//
// Manufacturer inventory overview.
//
// Product delete is gated behind a per-manufacturer "Manage" toggle:
//   1. Expand a manufacturer row (View)
//   2. Click "Manage" to enter manage mode for that manufacturer
//   3. Delete buttons appear on each product row
//   4. Click Done to exit manage mode and hide delete buttons
//
// No hover reveal. No accidental destructive affordances. Delete is a
// deliberate third action (View → Manage → Delete + confirm).

import React, { useCallback, useEffect, useState } from 'react';
import {
  CatalogApi,
  CatalogApiError,
  type ManufacturerStatsDto,
  type ProductDto,
} from '@/modules/FixturePlacementStudio/services/CatalogApi';
import { API_ROUTES } from '@/Application/ApiRoutes';
import { ProductCatalogActions } from '@/modules/Admin/ProductCatalog/ProductCatalogActions';

// ─── Component ───────────────────────────────────────────────────────────────

export const ManufacturerAdminPage: React.FC = () => {
  const [stats, setStats] = useState<ManufacturerStatsDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedName, setExpandedName] = useState<string | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);
  const handleCatalogChanged = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);

    CatalogApi.getManufacturerStats(ctrl.signal)
      .then((list) => {
        if (ctrl.signal.aborted) return;
        setStats(list);
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        console.error('[ManufacturerAdminPage] load failed:', err);
        setError(
          err instanceof CatalogApiError
            ? `Catalog error ${err.status}: ${err.message}`
            : err?.message ?? 'Failed to load manufacturers'
        );
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });

    return () => ctrl.abort();
  }, [refreshKey]);

  const totalProducts = stats.reduce((sum, s) => sum + s.productCount, 0);

  return (
    <div style={pageStyle}>
      <div style={headerRowStyle}>
        <h1 style={titleStyle}>Manufacturers</h1>
        <span style={countStyle}>
          {stats.length} manufacturers · {totalProducts} products
        </span>
      </div>

      <p style={descriptionStyle}>
        Every manufacturer referenced by at least one product in the catalog.
        Expand a row to see its products. Use the buttons below to import
        new products or update existing ones.
      </p>

      <div style={{ marginBottom: 20 }}>
        <ProductCatalogActions onCatalogChanged={handleCatalogChanged} />
      </div>

      {loading && <div style={muted}>Loading…</div>}
      {error && <div style={errorTextStyle}>{error}</div>}

      {!loading && !error && stats.length === 0 && (
        <div style={muted}>No manufacturers in the catalog.</div>
      )}

      {!loading && !error && stats.length > 0 && (
        <div style={tableStyle}>
          <div style={tableHeaderStyle}>
            <span>Name</span>
            <span style={{ textAlign: 'right' }}>Products</span>
            <span style={{ textAlign: 'right' }}>Actions</span>
          </div>
          {stats.map((row) => (
            <ManufacturerRow
              key={row.name}
              row={row}
              expanded={expandedName === row.name}
              onToggle={() =>
                setExpandedName((prev) => (prev === row.name ? null : row.name))
              }
              onProductDeleted={handleCatalogChanged}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Row ─────────────────────────────────────────────────────────────────────

const ManufacturerRow: React.FC<{
  row: ManufacturerStatsDto;
  expanded: boolean;
  onToggle: () => void;
  onProductDeleted: () => void;
}> = ({ row, expanded, onToggle, onProductDeleted }) => {
  const [products, setProducts] = useState<ProductDto[] | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Manage mode — when true, delete buttons are shown on each product row.
  // Reset to false whenever the panel collapses or a delete completes.
  const [manageMode, setManageMode] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!expanded) {
      // Collapsing the panel exits manage mode so the next expand
      // starts safe.
      setManageMode(false);
      return;
    }
    if (products !== null) return;

    const ctrl = new AbortController();
    setLoadingProducts(true);
    setProductsError(null);

    CatalogApi.listProducts({ manufacturer: row.name }, ctrl.signal)
      .then((list) => {
        if (ctrl.signal.aborted) return;
        setProducts(list);
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        console.error('[ManufacturerRow] product load failed:', err);
        setProductsError(
          err instanceof CatalogApiError
            ? `Catalog error ${err.status}: ${err.message}`
            : err?.message ?? 'Failed to load products'
        );
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoadingProducts(false);
      });

    return () => ctrl.abort();
  }, [expanded, row.name, products]);

  useEffect(() => {
    setProducts(null);
    setManageMode(false);
  }, [onProductDeleted]);

  const handleDelete = async (product: ProductDto) => {
    const confirmed = window.confirm(
      `Delete product "${product.name}" (${product.productCode})?\n\n` +
      `This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(product.id);
    setDeleteError(null);

    try {
      const url = API_ROUTES.PRODUCT_CATALOG_SERVICE.PRODUCTS.DELETE(product.id);
      const res = await fetch(url, { method: 'DELETE' });

      if (!res.ok) {
        const ct = res.headers.get('content-type') ?? '';
        let detail = '';
        if (ct.includes('application/json')) {
          const body = await res.json().catch(() => null);
          detail = body?.error ?? body?.title ?? '';
        } else {
          detail = (await res.text().catch(() => '')).slice(0, 200);
        }
        throw new Error(
          `Delete failed: ${res.status}${detail ? ` — ${detail}` : ''}`
        );
      }

      setProducts((prev) => (prev ? prev.filter((p) => p.id !== product.id) : prev));
      onProductDeleted();
    } catch (err: any) {
      setDeleteError(err.message ?? 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ borderBottom: '1px solid #1E293B' }}>
      <div style={rowHeaderStyle}>
        <span style={{ color: '#E2E8F0' }}>{row.name}</span>
        <span style={{ textAlign: 'right', color: '#94A3B8' }}>
          {row.productCount}
        </span>
        <span style={{ textAlign: 'right' }}>
          <button
            type="button"
            onClick={onToggle}
            style={{
              padding: '4px 10px',
              borderRadius: 4,
              border: '1px solid #334155',
              background: expanded ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: expanded ? '#7DD3FC' : '#94A3B8',
              fontSize: 10,
              fontWeight: 'bold',
              fontFamily: 'monospace',
              cursor: 'pointer',
            }}
          >
            {expanded ? 'Hide' : 'View'}
          </button>
        </span>
      </div>

      {expanded && (
        <div style={expandedPanelStyle}>
          {/* Manage bar — always visible while expanded, acts as gate
              for delete buttons. In manage mode shows a warning + Done
              button. In normal mode shows a small "Manage" button. */}
          {products && products.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                marginBottom: 8,
                padding: manageMode ? '6px 10px' : '0',
                background: manageMode ? 'rgba(251, 146, 60, 0.08)' : 'transparent',
                border: manageMode ? '1px solid rgba(251, 146, 60, 0.3)' : 'none',
                borderRadius: 4,
                transition: 'background 0.15s ease',
              }}
            >
              {manageMode ? (
                <>
                  <span style={{ fontSize: 10, color: '#FB923C' }}>
                    ⚠ Manage mode — delete is available
                  </span>
                  <button
                    type="button"
                    onClick={() => setManageMode(false)}
                    style={manageDoneBtnStyle}
                  >
                    Done
                  </button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1 }} />
                  <button
                    type="button"
                    onClick={() => setManageMode(true)}
                    title="Enable product deletion for this manufacturer"
                    style={manageBtnStyle}
                  >
                    ⚙ Manage
                  </button>
                </>
              )}
            </div>
          )}

          {loadingProducts && <div style={muted}>Loading products…</div>}
          {productsError && <div style={errorTextStyle}>{productsError}</div>}
          {deleteError && (
            <div style={{ ...errorTextStyle, marginBottom: 6 }}>{deleteError}</div>
          )}
          {products && products.length === 0 && (
            <div style={muted}>No products for this manufacturer.</div>
          )}
          {products && products.length > 0 && (
            <ul style={productListStyle}>
              {products.map((p) => (
                <li key={p.id} style={productRowStyle}>
                  <span
                    style={{
                      color: '#E2E8F0',
                      flex: 1,
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={p.name}
                  >
                    {p.name}
                  </span>
                  <span style={productCodeStyle}>
                    {p.productCode}
                    {p.family ? ` · ${p.family}` : ''}
                  </span>
                  {manageMode && (
                    <button
                      type="button"
                      onClick={() => handleDelete(p)}
                      disabled={deletingId === p.id}
                      title={
                        deletingId === p.id
                          ? 'Deleting…'
                          : `Delete "${p.name}" (${p.productCode})`
                      }
                      style={{
                        marginLeft: 8,
                        padding: '2px 6px',
                        borderRadius: 3,
                        border: '1px solid #7F1D1D',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#F87171',
                        fontSize: 10,
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                        cursor: deletingId === p.id ? 'wait' : 'pointer',
                        flexShrink: 0,
                        minWidth: 24,
                      }}
                    >
                      {deletingId === p.id ? '…' : '✕'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const pageStyle: React.CSSProperties = {
  padding: 20,
  maxWidth: 900,
  margin: '0 auto',
  color: '#E2E8F0',
  fontFamily: 'monospace',
};

const headerRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  marginBottom: 4,
};

const titleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 'bold',
  margin: 0,
  color: '#7DD3FC',
};

const countStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#64748B',
};

const descriptionStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#64748B',
  marginTop: 0,
  marginBottom: 16,
};

const muted: React.CSSProperties = {
  fontSize: 11,
  color: '#64748B',
  padding: '12px 0',
};

const errorTextStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#FCA5A5',
  padding: '8px 10px',
  background: 'rgba(239, 68, 68, 0.08)',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  borderRadius: 4,
};

const tableStyle: React.CSSProperties = {
  border: '1px solid #1E293B',
  borderRadius: 4,
  overflow: 'hidden',
};

const tableHeaderStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 100px 100px',
  padding: '8px 12px',
  background: '#0B0F19',
  borderBottom: '1px solid #1E293B',
  fontSize: 9,
  fontWeight: 'bold',
  color: '#475569',
  letterSpacing: 1,
  textTransform: 'uppercase',
};

const rowHeaderStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 100px 100px',
  padding: '10px 12px',
  fontSize: 11,
  alignItems: 'center',
};

const expandedPanelStyle: React.CSSProperties = {
  padding: '8px 12px 12px',
  background: '#080B12',
  borderTop: '1px solid #1E293B',
};

const productListStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  fontSize: 10,
};

const productRowStyle: React.CSSProperties = {
  padding: '4px 0',
  borderBottom: '1px dashed #1E293B',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const productCodeStyle: React.CSSProperties = {
  color: '#64748B',
  whiteSpace: 'nowrap',
  flexShrink: 0,
};

const manageBtnStyle: React.CSSProperties = {
  padding: '3px 8px',
  borderRadius: 4,
  border: '1px solid #334155',
  background: 'transparent',
  color: '#64748B',
  fontSize: 10,
  fontFamily: 'monospace',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const manageDoneBtnStyle: React.CSSProperties = {
  padding: '3px 10px',
  borderRadius: 4,
  border: '1px solid #FB923C',
  background: 'rgba(251, 146, 60, 0.15)',
  color: '#FB923C',
  fontSize: 10,
  fontFamily: 'monospace',
  fontWeight: 'bold',
  cursor: 'pointer',
};

export default ManufacturerAdminPage;