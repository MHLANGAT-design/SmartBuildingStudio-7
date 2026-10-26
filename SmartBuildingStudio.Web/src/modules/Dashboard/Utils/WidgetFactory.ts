import { DashboardWidget } from "@/modules/Dashboard/Models/DashboardWidget";
import { IWidgetLayoutConfig } from "@/modules/Dashboard/Services/WidgetService";

export class WidgetFactory {
  /**
   * Generates default tracking matrices tailored explicitly for specific architectural roles.
   */
  public static generateDefaultConfigsForRole(userRole: "Lead" | "Estimator" | "Technician"): IWidgetLayoutConfig[] {
    const baseModules: IWidgetLayoutConfig[] = [
      { widgetId: "recent-projects", headerTitle: "Active Engineering Scopes", isActive: true, sortingOrder: 0 },
      { widgetId: "recent-documents", headerTitle: "Recent Design Layouts", isActive: true, sortingOrder: 1 },
      { widgetId: "quick-launch", headerTitle: "Launch Engineering Studios", isActive: true, sortingOrder: 2 },
      { widgetId: "system-health", headerTitle: "System Health Diagnostics", isActive: true, sortingOrder: 3 },
      { widgetId: "activity-log", headerTitle: "Platform Activity Audit", isActive: true, sortingOrder: 4 }
    ];

    switch (userRole) {
      case "Technician":
        // Technicians focus on logging streams and diagnostic configurations
        return baseModules.map(mod => 
          mod.widgetId === "activity-log" ? { ...mod, sortingOrder: 1 } : mod
        );
      case "Estimator":
        // Estimators rarely require low-level infrastructure diagnostics tables
        return baseModules.filter(mod => mod.widgetId !== "system-health");
      case "Lead":
      default:
        return baseModules;
    }
  }

  /**
   * Builds an explicit runtime model instance from a configuration object.
   */
  public static createWidgetInstance(config: IWidgetLayoutConfig): DashboardWidget {
    return new DashboardWidget({
      id: config.widgetId,
      title: config.headerTitle,
      visible: config.isActive,
      gridOrder: config.sortingOrder
    });
  }
}
