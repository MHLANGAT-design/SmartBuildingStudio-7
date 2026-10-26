import { useAppSelector, useAppDispatch } from "@/Application/ConfigureStore";
import { useEffect, useCallback } from "react";
import { loadDashboardOverview } from "@/modules/Dashboard/Store/DashboardThunks";
import { setProjectSearchQuery, setActivitySeverityFilter } from "@/modules/Dashboard/Store/DashboardSlice";
import { 
  selectDashboardLoading, 
  selectDashboardError, 
  selectSystemHealth, 
  selectRecentDocuments,
  selectFilteredProjects, 
  selectFilteredActivities,
  selectDashboardFilters
} from "@/modules/Dashboard/Store/DashboardSelectors";

export function UseDashboard(autoRefresh = false) {
  const dispatch = useAppDispatch();

  const loading = useAppSelector(selectDashboardLoading);
  const error = useAppSelector(selectDashboardError);
  const health = useAppSelector(selectSystemHealth);
  const documents = useAppSelector(selectRecentDocuments);
  const projects = useAppSelector(selectFilteredProjects);
  const activities = useAppSelector(selectFilteredActivities);
  const filters = useAppSelector(selectDashboardFilters);

  const refreshTelemetry = useCallback(() => {
    // Added type assertion to bypass any custom Thunk wrappers
    dispatch(loadDashboardOverview() as any);
  }, [dispatch]);

  // FIX: Run initial fetch once on mount, keep stable polling logic separated
  useEffect(() => {
    refreshTelemetry();
  }, [refreshTelemetry]);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const handle = setInterval(() => {
      dispatch(loadDashboardOverview() as any);
    }, 45000); // Poll tracking maps every 45s
    
    return () => clearInterval(handle);
  }, [autoRefresh, dispatch]);

  const searchProjects = (query: string) => {
    dispatch(setProjectSearchQuery(query));
  };

  const filterActivities = (severity: typeof filters.activitySeverity) => {
    dispatch(setActivitySeverityFilter(severity));
  };

  return {
    loading,
    error,
    health,
    documents,
    projects,
    activities,
    filters,
    searchProjects,
    filterActivities,
    triggerRefresh: refreshTelemetry
  };
}
