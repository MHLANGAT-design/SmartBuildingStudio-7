// src/Application/ApiRoutes.ts

export const API_ROUTES = {
  // ============================================================
  // FLOOR PLAN SERVICE
  // ============================================================
  FLOOR_PLAN_SERVICE: {
    FLOOR_PLANS: {
      CREATE: `/api/FloorPlans`,
      GET: (id: string) => `/api/FloorPlans/${id}`,
      UPDATE: (id: string) => `/api/FloorPlans/${id}`,
      GET_BY_DOCUMENT: (documentId: string) =>
        `/api/FloorPlans/document/${documentId}`,
    },
  },

  // ============================================================
  // PROJECT EXPLORER SERVICE
  // ============================================================
  PROJECT_EXPLORER_SERVICE: {
    DOCUMENTS: {
      CREATE: (floorId: string) =>
        `/api/v1/project-explorer/floors/${floorId}/documents`,
      GET: (id: string) => `/api/v1/project-explorer/documents/${id}`,
      UPDATE: (id: string) => `/api/v1/project-explorer/documents/${id}`,
      LOCK: (id: string) => `/api/v1/project-explorer/documents/${id}/lock`,
      UNLOCK: (id: string) =>
        `/api/v1/project-explorer/documents/${id}/unlock`,
      FLOOR_PLAN: (id: string) =>
        `/api/v1/project-explorer/documents/${id}/floorplan`,
    },
    TREE: `/api/v1/project-explorer/tree`,
    BUILDINGS: (projectId: string) =>
      `/api/v1/project-explorer/projects/${projectId}/buildings`,
    FLOORS: (buildingId: string) =>
      `/api/v1/project-explorer/buildings/${buildingId}/floors`,
    ROOMS: (floorId: string) =>
      `/api/v1/project-explorer/floors/${floorId}/rooms`,
  },

  // ============================================================
  // DALI DESIGNER SERVICE
  // ============================================================
  DALI_DESIGNER_SERVICE: {
    /** Fixtures placed on a floorplan document — the source data for DaliDesigner. */
    PLACED_FIXTURES: (projectId: string, floorplanId: string) =>
      `/api/v1/project-explorer/projects/${projectId}/floorplans/${floorplanId}/fixtures`,

    /** DALI networks collection for a project. POST creates a new one. */
    NETWORKS: (projectId: string) =>
      `/api/v1/project-explorer/projects/${projectId}/dali-networks`,

    /** A single DALI network. GET / PUT / DELETE. */
    NETWORK: (projectId: string, networkId: string) =>
      `/api/v1/project-explorer/projects/${projectId}/dali-networks/${networkId}`,

    /**
     * List every DALI network attached to a floorplan document.
     */
    NETWORKS_FOR_FLOORPLAN: (projectId: string, floorplanId: string) =>
      `/api/v1/project-explorer/projects/${projectId}/floorplans/${floorplanId}/dali-networks`,
  },

  // ============================================================
  // PRODUCT CATALOG SERVICE
  // ============================================================
  PRODUCT_CATALOG_SERVICE: {
    PRODUCTS: {
      /** Base URL. Append `?manufacturer=&family=&type=&search=` to filter. */
      LIST: `/api/v1/product-catalog/products`,
      GET: (productId: string) =>
        `/api/v1/product-catalog/products/${productId}`,
      CREATE: `/api/v1/product-catalog/products`,
      DELETE: (productId: string) =>
        `/api/v1/product-catalog/products/${productId}`,
      /** Distinct manufacturer names. */
      MANUFACTURERS: `/api/v1/product-catalog/products/manufacturers`,
      /** Aggregate: manufacturer name + product count. */
      MANUFACTURER_STATS: `/api/v1/product-catalog/products/manufacturer-stats`,
      /** Distinct family names. */
      FAMILIES: `/api/v1/product-catalog/products/families`,
    },
    PHOTOMETRIC_FILES: {
      DISTRIBUTION: (productId: string) =>
        `/api/v1/product-catalog/products/${productId}/photometric-distribution`,
      UPLOAD: (productId: string) =>
        `/api/v1/product-catalog/photometric-files/${productId}`,
    },
    DATASHEETS: {
      LIST: (productId: string) =>
        `/api/v1/product-catalog/datasheets/${productId}`,
      UPLOAD: (productId: string) =>
        `/api/v1/product-catalog/datasheets/${productId}`,
    },
    CATEGORIES: {
      LIST: `/api/v1/product-catalog/categories`,
      CREATE: `/api/v1/product-catalog/categories`,
    },
    MANUFACTURERS: {
      LIST: `/api/v1/product-catalog/manufacturers`,
      CREATE: `/api/v1/product-catalog/manufacturers`,
    },
    CATALOG: {
      IMPORT: `/api/v1/product-catalog/catalog/import`,
      EXPORT: `/api/v1/product-catalog/catalog/export`,
    },
  },
};

export default API_ROUTES;