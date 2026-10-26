// src/modules/Admin/ProductCatalog/dialogs/ManualProductDialog.tsx
//
// "Add product manually" dialog.
//
// Fields:
//   Required — productCode, name, productType, manufacturer
//   Optional — family, wattage, lumens, cri, colorTemperature
//   Free-form — specifications (JSON textarea, validated on blur)
//
// Manufacturer is a free-text input with autocomplete from existing
// catalog values. The user can type any name — it doesn't have to be
// in the catalog already. If it matches an existing manufacturer, the
// input shows a subtle ✓. If it doesn't, it shows "will be created".
//
// ProductType is a dropdown of the backend's ProductType enum values
// (from CatalogImportController: Luminaire, Driver, Controller,
// Sensor, Gateway, EmergencyUnit, PowerSupply, Switch).
//
// Save POSTs a single-element array to the import endpoint.

import React, { useMemo, useState } from "react";
import { useProductCatalog } from "../hooks/useProductCatalog";
import { useProductImport } from "../hooks/useProductImport";
import type { ConverterEntry } from "../converters";

export interface ManualProductDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved?: (result: { imported: number; failed: number; errors: any[] }) => void;
}

const PRODUCT_TYPES = [
  "Luminaire",
  "Driver",
  "Controller",
  "Sensor",
  "Gateway",
  "EmergencyUnit",
  "PowerSupply",
  "Switch",
] as const;

type ProductType = typeof PRODUCT_TYPES[number];

// A synthetic converter so we can reuse useProductImport's save path
// (which handles the POST, invalidateCatalog, and result parsing).
// The "convert" step is identity — the user has already produced a
// single NormalizedProduct.
const MANUAL_CONVERTER: ConverterEntry = {
  id: "manual",
  label: "Manual entry",
  formats: ["json"],
  convertJson: (raw) => ({ products: raw as any[], skipped: [] }),
};

interface FormState {
  productCode: string;
  name: string;
  productType: ProductType;
  manufacturer: string;
  family: string;
  wattage: string;
  lumens: string;
  cri: string;
  colorTemperature: string;
  specifications: string;
}

const EMPTY_FORM: FormState = {
  productCode: "",
  name: "",
  productType: "Driver",
  manufacturer: "",
  family: "",
  wattage: "",
  lumens: "",
  cri: "",
  colorTemperature: "",
  specifications: "",
};

export const ManualProductDialog: React.FC<ManualProductDialogProps> = ({
  open,
  onClose,
  onSaved,
}) => {
  const catalog = useProductCatalog();
  const importer = useProductImport();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [specError, setSpecError] = useState<string | null>(null);

  const existingManufacturers = useMemo(
    () => new Set(catalog.manufacturers.map((m) => m.toLowerCase())),
    [catalog.manufacturers]
  );

  const manufacturerMatches =
    form.manufacturer.trim().length > 0 &&
    existingManufacturers.has(form.manufacturer.trim().toLowerCase());

  // Reset state whenever the dialog opens fresh.
  React.useEffect(() => {
    if (!open) return;
    setForm(EMPTY_FORM);
    setSpecError(null);
    importer.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const requiredComplete =
    form.productCode.trim().length > 0 &&
    form.name.trim().length > 0 &&
    form.manufacturer.trim().length > 0;

  const canSave = requiredComplete && !importer.saving && !specError;

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validateSpecifications = (): unknown => {
    const trimmed = form.specifications.trim();
    if (!trimmed) return undefined;
    try {
      const parsed = JSON.parse(trimmed);
      setSpecError(null);
      return parsed;
    } catch (e: any) {
      setSpecError(e.message ?? "Invalid JSON");
      return undefined;
    }
  };

  const handleSave = async () => {
    if (!canSave) return;
    const specs = validateSpecifications();
    if (specError) return;

    const product = {
      productCode: form.productCode.trim(),
      name: form.name.trim(),
      productType: form.productType,
      manufacturer: form.manufacturer.trim(),
      family: form.family.trim() || undefined,
      wattage: form.wattage.trim() ? Number(form.wattage) : undefined,
      lumens: form.lumens.trim() ? Number(form.lumens) : undefined,
      cri: form.cri.trim() ? Number(form.cri) : undefined,
      colorTemperature: form.colorTemperature.trim()
        ? Number(form.colorTemperature)
        : undefined,
      specifications: specs,
    };

    // Run through useProductImport's parse pipeline (identity converter)
    // so the save path is shared with the file-import dialog.
    await importer.parseRaw(
      [product],
      MANUAL_CONVERTER,
      "json",
      new Set() // no dedupe — the user is entering a product they want
    );
    importer.save((result) => {
      onSaved?.(result);
    });
  };

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <span style={{ fontWeight: "bold", fontSize: "13px" }}>
            Add product manually
          </span>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>

        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* ── Required section ─────────────────────────────── */}
          <SectionHeader>Required</SectionHeader>

          <FieldRow>
            <Field label="Product code" required>
              <input
                type="text"
                value={form.productCode}
                onChange={(e) => update("productCode", e.target.value)}
                placeholder="e.g. 929002089606"
                style={inputStyle}
              />
            </Field>
          </FieldRow>

          <FieldRow>
            <Field label="Name" required>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g. Xitanium 75W 0.2-1.0A"
                style={inputStyle}
              />
            </Field>
          </FieldRow>

          <FieldRow>
            <Field label="Product type" required>
              <select
                value={form.productType}
                onChange={(e) => update("productType", e.target.value as ProductType)}
                style={inputStyle}
              >
                {PRODUCT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
          </FieldRow>

          <FieldRow>
            <Field label="Manufacturer" required>
              <input
                type="text"
                value={form.manufacturer}
                onChange={(e) => update("manufacturer", e.target.value)}
                placeholder="Any name — new manufacturers welcome"
                style={inputStyle}
                list="manual-dialog-manufacturers"
              />
              <datalist id="manual-dialog-manufacturers">
                {catalog.manufacturers.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
              {form.manufacturer.trim().length > 0 && (
                <div style={{ fontSize: 10, marginTop: 2, color: manufacturerMatches ? "#05FFC4" : "#FBBF24" }}>
                  {manufacturerMatches
                    ? `✓ "${form.manufacturer.trim()}" exists in the catalog`
                    : `⚠ "${form.manufacturer.trim()}" is new — a manufacturer record will be created`}
                </div>
              )}
            </Field>
          </FieldRow>

          {/* ── Optional section ─────────────────────────────── */}
          <SectionHeader>Optional</SectionHeader>

          <FieldRow>
            <Field label="Family">
              <input
                type="text"
                value={form.family}
                onChange={(e) => update("family", e.target.value)}
                placeholder="e.g. Xitanium"
                style={inputStyle}
              />
            </Field>
          </FieldRow>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Wattage (W)">
              <input
                type="number"
                step="any"
                value={form.wattage}
                onChange={(e) => update("wattage", e.target.value)}
                placeholder="75"
                style={inputStyle}
              />
            </Field>
            <Field label="Lumens (lm)">
              <input
                type="number"
                step="any"
                value={form.lumens}
                onChange={(e) => update("lumens", e.target.value)}
                placeholder="1500"
                style={inputStyle}
              />
            </Field>
            <Field label="CRI">
              <input
                type="number"
                step="any"
                value={form.cri}
                onChange={(e) => update("cri", e.target.value)}
                placeholder="80"
                style={inputStyle}
              />
            </Field>
            <Field label="Color temp (K)">
              <input
                type="number"
                step="any"
                value={form.colorTemperature}
                onChange={(e) => update("colorTemperature", e.target.value)}
                placeholder="4000"
                style={inputStyle}
              />
            </Field>
          </div>

          {/* ── Specifications section ───────────────────────── */}
          <SectionHeader>Specifications (JSON)</SectionHeader>
          <textarea
            value={form.specifications}
            onChange={(e) => {
              update("specifications", e.target.value);
              setSpecError(null);
            }}
            onBlur={validateSpecifications}
            placeholder={'{\n  "vendor": "Philips",\n  "electrical": {\n    "minCurrentMa": 100,\n    "maxCurrentMa": 1100\n  }\n}'}
            rows={6}
            style={{
              ...inputStyle,
              fontFamily: "monospace",
              resize: "vertical",
              borderColor: specError ? "#EF4444" : "#334155",
            }}
          />
          {specError && (
            <div style={{ fontSize: 10, color: "#FCA5A5" }}>
              Invalid JSON: {specError}
            </div>
          )}

          {/* ── Save result ──────────────────────────────────── */}
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
                <ul style={{ margin: "6px 0 0 16px", padding: 0, fontSize: 10 }}>
                  {importer.saveResult.errors.slice(0, 5).map((err: any, i: number) => (
                    <li key={i}>
                      <span style={{ color: "#FCA5A5" }}>{err.productCode}</span>: {err.error}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ── Actions ──────────────────────────────────────── */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
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

// ─── Small presentational helpers ────────────────────────────────────

const SectionHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    fontSize: "9px",
    fontWeight: "bold",
    color: "#64748B",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    paddingTop: 4,
    borderTop: "1px solid #1E293B",
  }}>
    {children}
  </div>
);

const FieldRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div>{children}</div>
);

const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({
  label,
  required,
  children,
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <label style={{ fontSize: 10, color: "#94A3B8", textTransform: "uppercase" }}>
      {label}
      {required && <span style={{ color: "#EF4444", marginLeft: 4 }}>*</span>}
    </label>
    {children}
  </div>
);

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

export default ManualProductDialog;