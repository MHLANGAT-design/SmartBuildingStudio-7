// src/modules/Admin/ProductCatalog/ProductCatalogActions.tsx
//
// Three buttons that open the three import dialogs.
//
//   📥 Import from File  → ImportFromFileDialog  (Phase B — live)
//   ✏ Add Manually       → ManualProductDialog   (Phase C — live)
//   ♻ Update Catalog     → StubDialog             (Phase D — pending)

import React, { useState } from "react";
import { StubDialog } from "./dialogs/StubDialog";
import { ImportFromFileDialog } from "./dialogs/ImportFromFileDialog";
import { ManualProductDialog } from "./dialogs/ManualProductDialog";

type DialogKind = "file" | "manual" | "update" | null;

export interface ProductCatalogActionsProps {
  onCatalogChanged?: () => void;
}

export const ProductCatalogActions: React.FC<ProductCatalogActionsProps> = ({
  onCatalogChanged,
}) => {
  const [dialog, setDialog] = useState<DialogKind>(null);
  const close = () => setDialog(null);

  return (
    <>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => setDialog("file")}
          style={buttonStyle("#38BDF8")}
          title="Import products from a JSON or CSV file"
        >
          📥 Import from File
        </button>
        <button
          type="button"
          onClick={() => setDialog("manual")}
          style={buttonStyle("#A78BFA")}
          title="Add a single product by entering its parameters"
        >
          ✏ Add Manually
        </button>
        <button
          type="button"
          onClick={() => setDialog("update")}
          style={buttonStyle("#FFB800")}
          title="Update the catalog for a chosen manufacturer"
        >
          ♻ Update Catalog
        </button>
      </div>

      <ImportFromFileDialog
        open={dialog === "file"}
        onClose={close}
        onSaved={() => onCatalogChanged?.()}
      />

      <ManualProductDialog
        open={dialog === "manual"}
        onClose={close}
        onSaved={() => onCatalogChanged?.()}
      />

      <StubDialog
        open={dialog === "update"}
        title="Update catalog"
        description="Choose a manufacturer and update its products — either by uploading a fresh file or by editing existing products."
        onClose={close}
      />
    </>
  );
};

function buttonStyle(accent: string): React.CSSProperties {
  return {
    padding: "6px 14px",
    cursor: "pointer",
    border: `1px solid ${accent}`,
    borderRadius: "6px",
    backgroundColor: `${accent}15`,
    color: accent,
    fontSize: "11px",
    fontFamily: "monospace",
    fontWeight: "bold",
    transition: "all 0.15s ease",
    outline: "none",
  };
}

export default ProductCatalogActions;