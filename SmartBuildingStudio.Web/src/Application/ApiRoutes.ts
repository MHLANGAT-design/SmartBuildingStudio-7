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
    PLACED_FIXTURES: (projectId: string, floorplanId: string) =>
      `/api/v1/project-explorer/projects/${projectId}/floorplans/${floorplanId}/fixtures`,
    NETWORKS: (projectId: string) =>
      `/api/v1/project-explorer/projects/${projectId}/dali-networks`,
    NETWORK: (projectId: string, networkId: string) =>
      `/api/v1/project-explorer/projects/${projectId}/dali-networks/${networkId}`,
    NETWORKS_FOR_FLOORPLAN: (projectId: string, floorplanId: string) =>
      `/api/v1/project-explorer/projects/${projectId}/floorplans/${floorplanId}/dali-networks`,
  },

  // ============================================================
  // COMMISSIONING SERVICE
  // ============================================================
  COMMISSIONING_SERVICE: {
    /** POST — initialize a new field session for a project/floor. */
    START: `/api/v1/commissioning/start`,

    /** POST — save a session state snapshot (device states, faults, etc.). */
    SESSION: `/api/v1/commissioning/session`,

    /** POST — generate and persist the handover report. */
    REPORT: `/api/v1/commissioning/report`,

    /** POST — trigger a physical device scan on a gateway/line. */
    DEVICES_DISCOVER: (gatewayId: string, lineId: string) =>
      `/api/v1/commissioning/devices/discover?gatewayId=${gatewayId}&lineId=${lineId}`,

    /** GET — current physical state of a device. */
    DEVICE_STATE: (deviceId: string) =>
      `/api/v1/commissioning/devices/${deviceId}/state`,

    /** POST — send a test signal to a device and await verification. */
    TEST_SIGNAL: (deviceId: string) =>
      `/api/v1/commissioning/tests/signal/${deviceId}`,

    /** POST — run a full network sweep on a line. */
    TEST_NETWORK: `/api/v1/commissioning/tests/network`,

    /** GET — topology and health of a network line. */
    NETWORK_STATE: (gatewayId: string, lineId: string) =>
      `/api/v1/commissioning/networks/${gatewayId}/lines/${lineId}`,

    /** POST — reset a physical DALI bus line. */
    NETWORK_RESET: (gatewayId: string, lineId: string) =>
      `/api/v1/commissioning/networks/${gatewayId}/lines/${lineId}/reset`,

    /** GET — active (unresolved) faults for a session. */
    SESSION_FAULTS: (sessionId: string) =>
      `/api/v1/commissioning/sessions/${sessionId}/faults?active=true`,

    /** POST — mark a fault as resolved. */
    RESOLVE_FAULT: (faultId: string) =>
      `/api/v1/commissioning/faults/${faultId}/resolve`,

    /** POST — execute a scene and read back device levels. */
    TEST_SCENE: (sceneId: string) =>
      `/api/v1/commissioning/scenes/${sceneId}/test`,

    /** GET — recent signal logs for a device. */
    SIGNAL_LOGS: (deviceId: string) =>
      `/api/v1/commissioning/devices/${deviceId}/signals`,
  },

  // ============================================================
  // PRODUCT CATALOG SERVICE
  // ============================================================
  PRODUCT_CATALOG_SERVICE: {
    PRODUCTS: {
      LIST: `/api/v1/product-catalog/products`,
      GET: (productId: string) =>
        `/api/v1/product-catalog/products/${productId}`,
      CREATE: `/api/v1/product-catalog/products`,
      DELETE: (productId: string) =>
        `/api/v1/product-catalog/products/${productId}`,
      MANUFACTURERS: `/api/v1/product-catalog/products/manufacturers`,
      MANUFACTURER_STATS: `/api/v1/product-catalog/products/manufacturer-stats`,
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