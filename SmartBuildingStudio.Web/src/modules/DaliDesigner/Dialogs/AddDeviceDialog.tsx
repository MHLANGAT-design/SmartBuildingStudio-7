import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAppDispatch } from "@/store/hooks";
import { addDeviceFromLibrary } from "@/modules/DaliDesigner/store/daliThunks";
import { DeviceKind } from "@/modules/DaliDesigner/models/DaliDevice";
import {
  CatalogApi,
  CatalogApiError,
  ProductDto,
} from "@/modules/FixturePlacementStudio/services/CatalogApi";

/**
 * Backend ProductType (string) → DALI behavioral DeviceKind.
 *
 * Mirrors DaliNetworkManager.classifyFixture exactly, so a device
 * added from the catalog and a device imported from a floorplan
 * fixture end up with the same behavioral kind for the same
 * physical category. Keep these two mappings in sync.
 *
 * The full 8-entry map mirrors the backend ProductType enum. Only a
 * subset is reachable from this dialog (see CONTROL_DEVICE_TYPES
 * below); the rest are kept for exhaustiveness and future widening.
 *
 * classifyFixture collapses anything that isn't sensor or switch
 * into Ballast — including Gateway and Controller, which are not
 * DALI behavioral roles but do present on the bus as addressable
 * control gear.
 */
const PRODUCT_TYPE_TO_DEVICE_KIND: Record<string, DeviceKind> = {
  Luminaire:     "Ballast",
  Driver:        "Ballast",
  EmergencyUnit: "Ballast",
  PowerSupply:   "Ballast",
  Gateway:       "Ballast",   // was "Sensor" — align with classifyFixture
  Controller:    "Ballast",   // was "Sensor" — align with classifyFixture
  Sensor:        "Sensor",
  Switch:        "Switch",
};

/**
 * Product types offered in this dialog. Narrowed to the four control
 * device categories — physical products that participate in the DALI
 * bus as control devices. Excludes light-emitting gear and components
 * (Luminaire, EmergencyUnit, Driver, PowerSupply), which belong in
 * the floorplan fixture path, not an "Add Control Device" dialog.
 */
const CONTROL_DEVICE_TYPES = new Set([
  "Controller",
  "Sensor",
  "Gateway",
  "Switch",
]);

export function AddDeviceDialog({ onClose }: { onClose: () => void }) {
  const dispatch = useAppDispatch();

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback((signal?: AbortSignal) => {
    setStatus("loading");
    setErrorMsg(null);
    CatalogApi.listProducts(signal)
      .then((list) => {
        setProducts(list.filter((p) => CONTROL_DEVICE_TYPES.has(p.productType)));
        setStatus("ready");
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setErrorMsg(
          err instanceof CatalogApiError
            ? `Catalog error ${err.status}: ${err.message}`
            : err?.message ?? "Failed to load catalog"
        );
        setStatus("error");
      });
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.productCode.toLowerCase().includes(q) ||
        p.manufacturer.toLowerCase().includes(q)
    );
  }, [products, query]);

  const selected = filtered.find((p) => p.id === selectedId) ?? null;

  const addProduct = (p: ProductDto) => {
    const kind = PRODUCT_TYPE_TO_DEVICE_KIND[p.productType];
    if (!kind) return; // defensive — filtered upstream, but keeps types honest
    dispatch(
      addDeviceFromLibrary({
        kind,
        model: p.name,
        productId: p.id,
        productCode: p.productCode,
        sourceKind: p.productType,
        wattage: p.wattage,
      })
    );
    onClose();
  };

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dali-adddevice-title"
      >
        <h3 id="dali-adddevice-title">Add Control Device</h3>

        {status === "loading" && <p className="dialog-status">Loading catalog…</p>}

        {status === "error" && (
          <div className="dialog-error">
            <p>{errorMsg}</p>
            <button className="tb-btn" onClick={() => load()}>
              <span className="tb-label">Retry</span>
            </button>
          </div>
        )}

        {status === "ready" && (
          <>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && selected) addProduct(selected);
                if (e.key === "Escape") onClose();
              }}
              placeholder="Search by name, code, or manufacturer…"
            />

            {products.length === 0 ? (
              <p className="dialog-empty">No control devices in the catalog.</p>
            ) : filtered.length === 0 ? (
              <p className="dialog-empty">No matches for “{query}”.</p>
            ) : (
              <ul className="device-list" role="listbox">
                {filtered.map((p) => (
                  <li
                    key={p.id}
                    role="option"
                    aria-selected={p.id === selectedId}
                    className={
                      "device-list-item" +
                      (p.id === selectedId ? " is-selected" : "")
                    }
                    onClick={() => setSelectedId(p.id)}
                    onDoubleClick={() => {
                      setSelectedId(p.id);
                      addProduct(p);
                    }}
                  >
                    <span className="device-model">{p.name}</span>
                    <span className="device-kind">
                      {p.productType} · {p.productCode}
                      {p.manufacturer ? ` · ${p.manufacturer}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        <div className="dialog-actions">
          <button
            className="tb-btn tb-primary"
            disabled={status !== "ready" || !selected}
            onClick={() => selected && addProduct(selected)}
          >
            <span className="tb-label">Add</span>
          </button>
          <button className="tb-btn" onClick={onClose}>
            <span className="tb-label">Cancel</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddDeviceDialog;