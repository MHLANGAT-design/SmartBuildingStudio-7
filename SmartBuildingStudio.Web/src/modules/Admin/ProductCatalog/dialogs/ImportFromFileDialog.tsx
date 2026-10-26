// src/modules/Admin/ProductCatalog/dialogs/ImportFromFileDialog.tsx
//
// "Import products from file" dialog.
//
// Flow:
//   1. User picks a converter (manufacturer + format) from a dropdown
//      driven by the CONVERTERS registry.
//   2. User picks a file (.json or .csv depending on the converter's
//      supported formats).
//   3. The file is parsed + converted + deduped against the current
//      catalog via useProductImport.parseFile().
//   4. Preview shows: parsed count, skipped (with reasons), existing
//      (already in catalog), to-import count.
//   5. Save POSTs only the `toImport` array, then calls onSaved so
//      the parent can refresh the manufacturer list.

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CONVERTERS,
  type ConverterEntry,
  type FileFormat,
} from "../converters";
import { useProductCatalog } from "../hooks/useProductCatalog";
import { useProductImport } from "../hooks/useProductImport";

export interface ImportFromFileDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved?: (result: { imported: number; failed: number; errors: any[] }) => void;
}

export const ImportFromFileDialog: React.FC<ImportFromFileDialogProps> = ({
  open,
  onClose,
  onSaved,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [converterId, setConverterId] = useState<string>(CONVERTERS[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const catalog = useProductCatalog();
  const importer = useProductImport();

  const converter: ConverterEntry | undefined = useMemo(
    () => CONVERTERS.find((c) => c.id === converterId),
    [converterId]
  );

  const chosenFormat: FileFormat | null = useMemo(() => {
    if (!file) return null;
    const lower = file.name.toLowerCase();
    if (lower.endsWith(".csv")) return "csv";
    if (lower.endsWith(".json")) return "json";
    return null;
  }, [file]);

  useEffect(() => {
    if (!open) return;
    setFile(null);
    importer.reset();
    if (fileInputRef.current) fileInputRef.current.value = "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || !file || !converter || !chosenFormat) return;
    importer.parseFile(file, converter, chosenFormat, catalog.existingCodes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, file, converter, chosenFormat]);

  if (!open) return null;

  const canSave =
    !!importer.preview &&
    importer.preview.toImport.length > 0 &&
    !importer.saving;

  const handleFilePick = (picked: File | null) => {
    setFile(picked);
  };

  const handleSave = () => {
    importer.save((result) => {
      onSaved?.(result);
    });
  };

  const supportedExt = converter?.formats.includes("csv")
    ? converter.formats.includes("json")
      ? ".json,.csv"
      : ".csv"
    : ".json";

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <span style={{ fontWeight: "bold", fontSize: "13px" }}>
            Import products from file
          </span>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>

        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={labelStyle}>Manufacturer / format</label>
            <select
              value={converterId}
              onChange={(e) => {
                setConverterId(e.target.value);
                setFile(null);
                importer.reset();
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              style={inputStyle}
            >
              {CONVERTERS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label} · {c.formats.join(", ").toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>File</label>
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
                  Drop a file here or click to choose ({supportedExt})
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={supportedExt}
              style={{ display: "none" }}
              onChange={(e) => handleFilePick(e.target.files?.[0] ?? null)}
            />
          </div>

          {importer.parseError && (
            <div style={errorBoxStyle}>
              Parse error: {importer.parseError}
            </div>
          )}

          {importer.parsing && (
            <div style={{ fontSize: "11px", color: "#64748B" }}>Parsing…</div>
          )}
          {importer.preview && !importer.parsing && (
            <PreviewPanel preview={importer.preview} />
          )}

          {importer.saveError && (
            <div style={errorBoxStyle}>Import failed: {importer.saveError}</div>
          )}
          {importer.saveResult && (
            <div style={successBoxStyle}>
              ✅ Imported {importer.saveResult.imported} product
              {importer.saveResult.imported === 1 ? "" : "s"}
              {importer.saveResult.failed > 0
                ? ` · ${importer.saveResult.failed} failed`
                : ""}
              {importer.saveResult.errors.length > 0 && (
                <ul style={{ margin: "6px 0 0 16px", padding: 0, fontSize: "10px" }}>
                  {importer.saveResult.errors.slice(0, 5).map((e: any, i: number) => (
                    <li key={i}>
                      <span style={{ color: "#FCA5A5" }}>{e.productCode}</span>: {e.error}
                    </li>
                  ))}
                  {importer.saveResult.errors.length > 5 && (
                    <li>…and {importer.saveResult.errors.length - 5} more</li>
                  )}
                </ul>
              )}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
            <button onClick={onClose} style={cancelBtnStyle}>
              {importer.saveResult ? "Close" : "Cancel"}
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              style={canSave ? saveBtnActiveStyle : saveBtnDisabledStyle}
            >
              {importer.saving ? "Saving…" : "💾 Save to catalog"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PreviewPanel: React.FC<{ preview: ReturnType<typeof useProductImport>["preview"] }> = ({ preview }) => {
  if (!preview) return null;
  const { products, skipped, existing, toImport } = preview;
  return (
    <div style={previewBoxStyle}>
      <div style={{ fontSize: "11px", color: "#E2E8F0", marginBottom: "8px" }}>
        <strong>{preview.sourceLabel}</strong>
      </div>

      <div style={{ display: "flex", gap: "16px", fontSize: "10px", marginBottom: "8px" }}>
        <Stat label="Parsed" value={products.length} accent="#94A3B8" />
        <Stat label="Skipped" value={skipped.length} accent={skipped.length ? "#FBBF24" : "#94A3B8"} />
        <Stat label="Already in catalog" value={existing.length} accent={existing.length ? "#94A3B8" : "#475569"} />
        <Stat label="To import" value={toImport.length} accent={toImport.length ? "#05FFC4" : "#94A3B8"} />
      </div>

      {skipped.length > 0 && (
        <div style={{ marginTop: "6px" }}>
          <div style={{ fontSize: "10px", color: "#FBBF24", marginBottom: "2px" }}>
            Skipped rows (not valid products):
          </div>
          <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "10px", color: "#94A3B8" }}>
            {skipped.slice(0, 3).map((s, i) => (
              <li key={i}>{s.reason}</li>
            ))}
            {skipped.length > 3 && <li>…and {skipped.length - 3} more</li>}
          </ul>
        </div>
      )}

      {toImport.length > 0 && (
        <div style={{ marginTop: "8px" }}>
          <div style={{ fontSize: "10px", color: "#64748B", marginBottom: "2px" }}>
            Will import:
          </div>
          <div style={{ maxHeight: "160px", overflowY: "auto", border: "1px solid #1E293B", borderRadius: "3px", padding: "4px 8px" }}>
            {toImport.slice(0, 50).map((p) => (
              <div key={p.productCode} style={{ fontSize: "10px", display: "flex", gap: "8px", padding: "2px 0" }}>
                <span style={{ color: "#7DD3FC", width: "120px", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.productCode}
                </span>
                <span style={{ color: "#E2E8F0", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.name}
                </span>
              </div>
            ))}
            {toImport.length > 50 && (
              <div style={{ fontSize: "10px", color: "#64748B", paddingTop: "4px" }}>
                …and {toImport.length - 50} more
              </div>
            )}
          </div>
        </div>
      )}

      {existing.length > 0 && (
        <div style={{ fontSize: "10px", color: "#64748B", marginTop: "6px" }}>
          {existing.length} product{existing.length === 1 ? "" : "s"} skipped because the product code is already in the catalog.
        </div>
      )}
    </div>
  );
};

const Stat: React.FC<{ label: string; value: number; accent: string }> = ({ label, value, accent }) => (
  <div>
    <div style={{ fontSize: "9px", color: "#64748B", textTransform: "uppercase" }}>{label}</div>
    <div style={{ fontSize: "14px", fontWeight: "bold", color: accent }}>{value}</div>
  </div>
);

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

export default ImportFromFileDialog;