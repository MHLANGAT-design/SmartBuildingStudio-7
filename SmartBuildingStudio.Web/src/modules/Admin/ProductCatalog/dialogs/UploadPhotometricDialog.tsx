// src/modules/Admin/ProductCatalog/dialogs/UploadPhotometricDialog.tsx
//
// "Upload photometric file" dialog.
//
// Flow:
//   1. User searches for a product (debounced search against the catalog)
//   2. User drops or picks an .ies / .ldt file
//   3. Client-side parser shows a preview (lumens, candela, samples)
//   4. User clicks Upload → POST multipart to
//      /api/v1/product-catalog/photometric-files/{productId}
//   5. On success: invalidate the FPS photometric resolver cache so the
//      next Calculate Lux refetches, show success, allow closing.
//
// The preview parser is client-side only. The backend re-parses after
// upload and is authoritative.

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CatalogApi,
  type ProductDto,
} from "@/modules/FixturePlacementStudio/services/CatalogApi";
import {
  parseIesForPreview,
  isIesPreviewSuccess,
  type IesPreviewOutcome,
} from "../lib/iesClientParser";
import { resetPhotometricResolverCache } from "@/modules/FixturePlacementStudio/store/fixtureSelectors";

export interface UploadPhotometricDialogProps {
  open: boolean;
  onClose: () => void;
  onUploaded?: (result: {
    productId: string;
    fileName: string;
    version: number;
    sampleCount: number;
  }) => void;
}

interface UploadResponse {
  productId: string;
  photometricFileId: string;
  version: number;
  sampleCount: number;
  totalLumens: number;
  peakCandela: number;
  symmetry: string;
  url: string;
}

const SEARCH_DEBOUNCE_MS = 250;

export const UploadPhotometricDialog: React.FC<UploadPhotometricDialogProps> = ({
  open,
  onClose,
  onUploaded,
}) => {
  // Product search
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ProductDto | null>(null);

  // File state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<IesPreviewOutcome | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<UploadResponse | null>(null);

  // Debounce query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  // Fetch products when query changes
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setSearching(true);
    setSearchError(null);

    CatalogApi.listProducts(
      debouncedQuery.length > 0 ? { search: debouncedQuery } : undefined
    )
      .then((list) => {
        if (cancelled) return;
        setProducts(list.slice(0, 50));
      })
      .catch((err) => {
        if (cancelled) return;
        setSearchError(err?.message ?? "Failed to load products");
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, debouncedQuery]);

  // Reset on open
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setDebouncedQuery("");
    setProducts([]);
    setSelected(null);
    setFile(null);
    setPreview(null);
    setUploadError(null);
    setUploadSuccess(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [open]);

  // Parse file when selected
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    let cancelled = false;
    file
      .text()
      .then((text) => {
        if (cancelled) return;
        setPreview(parseIesForPreview(text));
      })
      .catch((err) => {
        if (cancelled) return;
        setPreview({ error: err?.message ?? "Failed to read file" });
      });

    return () => {
      cancelled = true;
    };
  }, [file]);

  const canUpload = useMemo(() => {
    if (!selected || !file || !preview) return false;
    if (!isIesPreviewSuccess(preview)) return false;
    return !uploading;
  }, [selected, file, preview, uploading]);

  const handleFilePick = useCallback((picked: File | null) => {
    setUploadError(null);
    setUploadSuccess(null);
    if (!picked) {
      setFile(null);
      return;
    }
    const lower = picked.name.toLowerCase();
    if (!lower.endsWith(".ies") && !lower.endsWith(".ldt")) {
      setUploadError("Only .ies or .ldt files are accepted.");
      return;
    }
    setFile(picked);
  }, []);

  const handleUpload = async () => {
    if (!selected || !file || !canUpload) return;
    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `/api/v1/product-catalog/photometric-files/${selected.id}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("application/json")) {
        const text = await res.text().catch(() => "");
        throw new Error(
          `Upload endpoint returned non-JSON (${res.status} ${ct}). ` +
          `First 200 chars: ${text.slice(0, 200)}`
        );
      }

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.error ?? `Upload failed (${res.status})`);
      }

      const result = body as UploadResponse;

      // Invalidate the resolver cache so the next Calculate Lux sees the
      // newly-uploaded data instead of the stale 404/null result.
      resetPhotometricResolverCache();

      setUploadSuccess(result);
      onUploaded?.({
        productId: result.productId,
        fileName: file.name,
        version: result.version,
        sampleCount: result.sampleCount,
      });
    } catch (err: any) {
      setUploadError(err?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <span style={{ fontWeight: "bold", fontSize: "13px" }}>
            Upload photometric file
          </span>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>

        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* ── Step 1 — Product picker ──────────────────────────── */}
          <div>
            <label style={labelStyle}>Product</label>
            {selected ? (
              <div style={selectedProductStyle}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "12px", color: "#E2E8F0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {selected.name}
                  </div>
                  <div style={{ fontSize: "10px", color: "#64748B", fontFamily: "monospace" }}>
                    {selected.productCode}
                    {selected.manufacturer ? ` · ${selected.manufacturer}` : ""}
                    {selected.lumens > 0 ? ` · ${selected.lumens} lm` : ""}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  style={smallBtnStyle}
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, code, or manufacturer…"
                  style={inputStyle}
                  autoFocus
                />
                {searching && (
                  <div style={muted}>Searching…</div>
                )}
                {searchError && (
                  <div style={errorBoxStyle}>{searchError}</div>
                )}
                {!searching && products.length > 0 && (
                  <div style={resultsContainerStyle}>
                    {products.slice(0, 10).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelected(p)}
                        style={resultRowStyle}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(56, 189, 248, 0.08)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                          <div style={{ fontSize: "11px", color: "#E2E8F0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: "9px", color: "#64748B", fontFamily: "monospace" }}>
                            {p.productCode}
                            {p.manufacturer ? ` · ${p.manufacturer}` : ""}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {!searching && debouncedQuery.length > 0 && products.length === 0 && (
                  <div style={muted}>No products match "{debouncedQuery}".</div>
                )}
              </>
            )}
          </div>

          {/* ── Step 2 — File picker ─────────────────────────────── */}
          <div>
            <label style={labelStyle}>Photometric file</label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                const dropped = e.dataTransfer.files?.[0];
                if (dropped) handleFilePick(dropped);
              }}
              onClick={() => fileInputRef.current?.click()}
              style={{
                ...dropZoneStyle,
                borderColor: dragActive ? "#38BDF8" : "#334155",
                background: dragActive ? "rgba(56,189,248,0.08)" : "#0B0F19",
                cursor: "pointer",
              }}
            >
              {file ? (
                <div>
                  <div style={{ fontSize: "12px", color: "#E2E8F0" }}>{file.name}</div>
                  <div style={{ fontSize: "10px", color: "#64748B", marginTop: "2px" }}>
                    {(file.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: "11px", color: "#64748B" }}>
                  Drop an .ies or .ldt file here, or click to choose
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".ies,.ldt"
              style={{ display: "none" }}
              onChange={(e) => handleFilePick(e.target.files?.[0] ?? null)}
            />
          </div>

          {/* ── Step 3 — Preview ────────────────────────────────── */}
          {preview && (
            <div style={previewBoxStyle}>
              {isIesPreviewSuccess(preview) ? (
                <>
                  <div style={{ fontSize: "10px", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                    Preview
                  </div>
                  <div style={previewRowStyle}>
                    <span style={previewLabelStyle}>Total lumens</span>
                    <span style={previewValueStyle}>{preview.totalLumens.toFixed(0)} lm</span>
                  </div>
                  <div style={previewRowStyle}>
                    <span style={previewLabelStyle}>Peak candela</span>
                    <span style={previewValueStyle}>{preview.peakCandela.toFixed(2)} cd</span>
                  </div>
                  <div style={previewRowStyle}>
                    <span style={previewLabelStyle}>Symmetry</span>
                    <span style={previewValueStyle}>{preview.symmetry}</span>
                  </div>
                  <div style={previewRowStyle}>
                    <span style={previewLabelStyle}>Samples</span>
                    <span style={previewValueStyle}>
                      {preview.sampleCount} ({preview.verticalAngleCount}×{preview.horizontalAngleCount})
                    </span>
                  </div>
                  {preview.manufacturer && (
                    <div style={previewRowStyle}>
                      <span style={previewLabelStyle}>Manufacturer</span>
                      <span style={previewValueStyle}>{preview.manufacturer}</span>
                    </div>
                  )}
                  {preview.luminaireName && (
                    <div style={previewRowStyle}>
                      <span style={previewLabelStyle}>Luminaire</span>
                      <span style={{ ...previewValueStyle, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "220px" }} title={preview.luminaireName}>
                        {preview.luminaireName}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div style={errorBoxStyle}>
                  Parse failed: {preview.error}
                </div>
              )}
            </div>
          )}

          {/* ── Step 4 — Upload feedback ────────────────────────── */}
          {uploadError && (
            <div style={errorBoxStyle}>{uploadError}</div>
          )}
          {uploadSuccess && (
            <div style={successBoxStyle}>
              ✅ Uploaded "{file?.name}" — version {uploadSuccess.version} ·{" "}
              {uploadSuccess.sampleCount} samples · {uploadSuccess.totalLumens} lm
              <div style={{ fontSize: "10px", color: "#05FFC4", marginTop: "6px", opacity: 0.75 }}>
                Resolver cache cleared — the next Calculate Lux will use this data.
              </div>
            </div>
          )}

          {/* ── Actions ─────────────────────────────────────────── */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
            <button onClick={onClose} style={cancelBtnStyle}>
              {uploadSuccess ? "Close" : "Cancel"}
            </button>
            <button
              onClick={handleUpload}
              disabled={!canUpload}
              style={canUpload ? saveBtnActiveStyle : saveBtnDisabledStyle}
            >
              {uploading ? "Uploading…" : "📐 Upload IES"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────

const backdropStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const dialogStyle: React.CSSProperties = {
  background: "#0F1424",
  border: "1px solid #1E293B",
  borderRadius: "8px",
  minWidth: "560px",
  maxWidth: "90vw",
  maxHeight: "90vh",
  overflowY: "auto",
  fontFamily: "monospace",
  color: "#E2E8F0",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 16px",
  borderBottom: "1px solid #1E293B",
};

const closeBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#64748B",
  cursor: "pointer",
  fontSize: "14px",
  padding: "0 4px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "10px",
  color: "#64748B",
  textTransform: "uppercase",
  marginBottom: "4px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#06080F",
  border: "1px solid #334155",
  borderRadius: "4px",
  color: "#E2E8F0",
  fontSize: "11px",
  padding: "6px 8px",
  outline: "none",
  boxSizing: "border-box",
};

const selectedProductStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "8px 10px",
  background: "rgba(56, 189, 248, 0.08)",
  border: "1px solid rgba(56, 189, 248, 0.4)",
  borderRadius: "4px",
};

const resultsContainerStyle: React.CSSProperties = {
  marginTop: "4px",
  maxHeight: "180px",
  overflowY: "auto",
  border: "1px solid #1E293B",
  borderRadius: "4px",
  background: "#0B0F19",
};

const resultRowStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 10px",
  background: "transparent",
  border: "none",
  borderBottom: "1px solid #1E293B",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  cursor: "pointer",
  transition: "background 0.1s ease",
};

const smallBtnStyle: React.CSSProperties = {
  padding: "2px 8px",
  border: "1px solid #334155",
  background: "transparent",
  color: "#94A3B8",
  fontSize: "10px",
  borderRadius: "3px",
  fontFamily: "monospace",
  cursor: "pointer",
};

const dropZoneStyle: React.CSSProperties = {
  width: "100%",
  padding: "20px",
  border: "2px dashed #334155",
  borderRadius: "6px",
  textAlign: "center",
  transition: "all 0.15s ease",
  boxSizing: "border-box",
};

const previewBoxStyle: React.CSSProperties = {
  background: "#0B0F19",
  border: "1px solid #1E293B",
  borderRadius: "6px",
  padding: "12px",
};

const previewRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  fontSize: "10px",
  padding: "2px 0",
};

const previewLabelStyle: React.CSSProperties = {
  color: "#64748B",
};

const previewValueStyle: React.CSSProperties = {
  color: "#E2E8F0",
  fontWeight: "bold",
  fontFamily: "monospace",
};

const muted: React.CSSProperties = {
  fontSize: "11px",
  color: "#64748B",
  padding: "8px 0",
};

const errorBoxStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "#FCA5A5",
  padding: "8px 10px",
  background: "rgba(239, 68, 68, 0.08)",
  border: "1px solid rgba(239, 68, 68, 0.3)",
  borderRadius: "4px",
};

const successBoxStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "#05FFC4",
  padding: "8px 10px",
  background: "rgba(5, 255, 196, 0.08)",
  border: "1px solid rgba(5, 255, 196, 0.3)",
  borderRadius: "4px",
};

const cancelBtnStyle: React.CSSProperties = {
  padding: "6px 14px",
  border: "1px solid #334155",
  background: "transparent",
  color: "#94A3B8",
  borderRadius: "6px",
  fontSize: "11px",
  fontFamily: "monospace",
  cursor: "pointer",
};

const saveBtnActiveStyle: React.CSSProperties = {
  padding: "6px 14px",
  border: "1px solid #38BDF8",
  background: "rgba(56, 189, 248, 0.15)",
  color: "#38BDF8",
  borderRadius: "6px",
  fontSize: "11px",
  fontFamily: "monospace",
  fontWeight: "bold",
  cursor: "pointer",
};

const saveBtnDisabledStyle: React.CSSProperties = {
  padding: "6px 14px",
  border: "1px solid #1E293B",
  background: "rgba(15, 23, 42, 0.4)",
  color: "#475569",
  borderRadius: "6px",
  fontSize: "11px",
  fontFamily: "monospace",
  fontWeight: "bold",
  cursor: "not-allowed",
};

export default UploadPhotometricDialog;