import { FloorPlanApi } from "@/modules/FloorPlanDesigner/Services/FloorPlanApi";
import { ProjectExplorerApi } from "@/modules/ProjectExplorer/Services/ProjectExplorerApi";

/**
 * Global Dependency Injection Core Container for Smart Building Studio.
 * Exposes active microservice API client layers to Redux middleware contexts.
 */
export interface ApplicationServices {
    floorPlanApi: FloorPlanApi;
    projectExplorerApi: ProjectExplorerApi; // Registered active service link
    // Future services:
    // lightingDesignApi: LightingDesignApi;
    // engineeringRulesApi: EngineeringRulesApi;
    // productCatalogApi: ProductCatalogApi;
}
