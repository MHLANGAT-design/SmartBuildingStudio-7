import { DashboardState, RecentProject, RecentDocument, SystemJobActivity, SystemHealthMetric } from "@/modules/Dashboard/Store/DashboardTypes";

const initialState: DashboardState = {
  recentProjects: [],
  recentDocuments: [],
  activities: [],
  health: null,
  loading: false,
  error: null,
  activeFilters: {
    projectQuery: "",
    activitySeverity: "All"
  }
};

/**
 * Pure state reducer orchestrator substituting Redux Toolkit createSlice boilerplate.
 * Maintains telemetry streams, health data models, and recent document allocations.
 */
export default function dashboardReducer(
  state: DashboardState = initialState,
  action: { type: string; payload?: any }
): DashboardState {
  switch (action.type) {
    case "dashboard/setDashboardLoading":
      return {
        ...state,
        loading: action.payload
      };

    case "dashboard/setDashboardError":
      return {
        ...state,
        error: action.payload
      };

    case "dashboard/populateDashboardTelemetry": {
      const payload = action.payload as {
        projects: RecentProject[];
        documents: RecentDocument[];
        activities: SystemJobActivity[];
        health: SystemHealthMetric;
      };
      return {
        ...state,
        recentProjects: payload.projects,
        recentDocuments: payload.documents,
        activities: payload.activities,
        health: payload.health,
        error: null
      };
    }

    case "dashboard/setProjectSearchQuery":
      return {
        ...state,
        activeFilters: {
          ...state.activeFilters,
          projectQuery: action.payload
        }
      };

    case "dashboard/setActivitySeverityFilter":
      return {
        ...state,
        activeFilters: {
          ...state.activeFilters,
          activitySeverity: action.payload
        }
      };

    case "dashboard/resetDashboardState":
      return {
        ...initialState
      };

    default:
      return state;
  }
}

// Type-safe action creators matching existing Dashboard Thunk contracts
export const setDashboardLoading = (loading: boolean) => ({
  type: "dashboard/setDashboardLoading",
  payload: loading,
});

export const setDashboardError = (error: string | null) => ({
  type: "dashboard/setDashboardError",
  payload: error,
});

export const populateDashboardTelemetry = (payload: {
  projects: RecentProject[];
  documents: RecentDocument[];
  activities: SystemJobActivity[];
  health: SystemHealthMetric;
}) => ({
  type: "dashboard/populateDashboardTelemetry",
  payload,
});

export const setProjectSearchQuery = (query: string) => ({
  type: "dashboard/setProjectSearchQuery",
  payload: query,
});

export const setActivitySeverityFilter = (severity: DashboardState["activeFilters"]["activitySeverity"]) => ({
  type: "dashboard/setActivitySeverityFilter",
  payload: severity,
});

export const resetDashboardState = () => ({
  type: "dashboard/resetDashboardState",
});
