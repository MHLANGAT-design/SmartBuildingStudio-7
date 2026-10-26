import { DashboardWidget } from "@/modules/Dashboard/Models/DashboardWidget";

export interface IWidgetLayoutConfig {
  widgetId: string;
  headerTitle: string;
  isActive: boolean;
  sortingOrder: number;
}

export class WidgetService {
  private static readonly STORAGE_KEY = "sbs_dashboard_grid_state";

  /**
   * Loads personal card layouts safely out of persistent client storage matrices.
   */
  public static loadPersistedLayout(fallbackDefaults: IWidgetLayoutConfig[]): DashboardWidget[] {
    try {
      if (typeof window === "undefined") return this.instantiateWidgets(fallbackDefaults);
      
      const storedJson = localStorage.getItem(this.STORAGE_KEY);
      if (!storedJson) return this.instantiateWidgets(fallbackDefaults);

      const parsedConfigs: IWidgetLayoutConfig[] = JSON.parse(storedJson);
      return this.instantiateWidgets(parsedConfigs);
    } catch (error) {
      console.error("[Dashboard Layout Exception] Restoring grid layout positions failed. Applying recovery defaults.", error);
      return this.instantiateWidgets(fallbackDefaults);
    }
  }

  /**
   * Commits modified layout visibility grids back down into localized storage arrays.
   */
  public static persistLayoutState(widgets: DashboardWidget[]): void {
    try {
      if (typeof window === "undefined") return;

      const configs: IWidgetLayoutConfig[] = widgets.map((w) => ({
        widgetId: w.getId(),
        headerTitle: w.getTitle(),
        isActive: w.isVisible(),
        sortingOrder: w.getGridOrder()
      }));

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configs));
    } catch (error) {
      console.error("[Dashboard Storage Fault] Failed to write grid placement indices to browser memory.", error);
    }
  }

  /**
   * Utility method to generate clean runtime class arrays from configurations.
   */
  private static instantiateWidgets(configs: IWidgetLayoutConfig[]): DashboardWidget[] {
    return configs
      .map(
        (c) =>
          new DashboardWidget({
            id: c.widgetId,
            title: c.headerTitle,
            visible: c.isActive,
            gridOrder: c.sortingOrder
          })
      )
      .sort((a, b) => a.getGridOrder() - b.getGridOrder());
  }
}
