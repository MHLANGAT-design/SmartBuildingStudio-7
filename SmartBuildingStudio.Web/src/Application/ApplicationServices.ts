// src/Application/ApplicationServices.ts

import { FloorPlanApi } from "@/modules/FloorPlanDesigner/Services/FloorPlanApi";
import { ProjectExplorerApi } from "@/modules/ProjectExplorer/Services/ProjectExplorerApi";
import {
  DeviceDiscoveryApi,
  type DeviceDiscoveryApiClient,
} from "@/modules/DeviceDiscovery/Services/DeviceDiscoveryApi";

/**
 * Global Dependency Injection Core Container for Smart Building Studio.
 * Exposes active microservice API client layers to Redux middleware contexts.
 *
 * Every field is a plain API client (not a domain service wrapper). Domain
 * services live inside each module and call their own API client; the
 * container exists so cross-cutting thunks and tests can swap transports
 * per-store rather than rely on module singletons.
 */
export interface ApplicationServices {
    floorPlanApi: FloorPlanApi;
    projectExplorerApi: ProjectExplorerApi; // Registered active service link

    /**
     * DeviceDiscovery outbound port.
     *
     * This is the same `DeviceDiscoveryApi` object the module's Services/*
     * wrappers import directly — there is one transport and one mock switch
     * (`USE_MOCK` in `Services/apiConfig.ts`) regardless of how a caller
     * reaches it. Wired here so thunks can read it via
     * `extra.services.deviceDiscoveryApi` for DI and testability.
     */
    deviceDiscoveryApi: DeviceDiscoveryApiClient;

    // Future services:
    // gatewayManagementApi: GatewayManagementApi;
    // commissioningApi: CommissioningApi;
    // lightingDesignApi: LightingDesignApi;
    // engineeringRulesApi: EngineeringRulesApi;
    // productCatalogApi: ProductCatalogApi;
}