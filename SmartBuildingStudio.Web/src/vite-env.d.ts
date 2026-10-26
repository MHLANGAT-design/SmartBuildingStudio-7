/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PROJECT_EXPLORER_URL?: string;
  readonly VITE_PRODUCT_CATALOG_URL?: string;
  readonly VITE_USE_STUB_PHOTOMETRIC?: string;
  readonly VITE_DASHBOARD_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}