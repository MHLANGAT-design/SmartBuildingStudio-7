# Catalog import — manufacturer converters

Each manufacturer ships catalog data in a different JSON shape. This
folder translates them into the single canonical shape accepted by
`POST /api/productcatalog/catalog/import/json`.

## Adding a new manufacturer

1. Create `scripts/import-catalogs/<vendor>.ts` with a function
   `convert<Vendor>(raw: unknown[]): ConvertResult`.
2. Map required fields: `productCode`, `name`, `productType`,
   `manufacturer`.
3. Map optional scalars: `wattage`, `lumens`, `cri`, `colorTemperature`.
   Set to 0 when the vendor JSON doesn't provide them.
4. Put all remaining vendor-specific data into `specifications`.
5. **Normalize units** where downstream code might compare values:
   - currents → milliamps (mA)
   - voltages → volts (V) numeric; ranges → `[min, max]`
   - wattages → watts (W)
   - color temperatures → kelvin (K)
6. Register the converter in `run.ts`.
7. Test with `API_BASE=http://localhost:5000 ts-node scripts/import-catalogs/run.ts <vendor> <file.json>`.

## Current converters

| Manufacturer | File          | Source schema | Notes |
|--------------|---------------|---------------|-------|
| Tridonic     | `tridonic.ts` | Driver JSON   | mA native |
| Philips      | `philips.ts`  | Xitanium JSON | A → mA conversion |

## Endpoint

`POST /api/productcatalog/catalog/import/json` accepts an array of: