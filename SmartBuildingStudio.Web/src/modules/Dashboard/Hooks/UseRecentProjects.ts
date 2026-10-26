import { useAppSelector, useAppDispatch } from "@/Application/ConfigureStore";
import { setProjectSearchQuery } from "@/modules/Dashboard/Store/DashboardSlice";
import {
  selectFilteredProjects,
  selectDashboardFilters,
  selectDashboardLoading
} from "@/modules/Dashboard/Store/DashboardSelectors";

export function UseRecentProjects() {
  const dispatch = useAppDispatch();

  const projects = useAppSelector(selectFilteredProjects);
  const filters = useAppSelector(selectDashboardFilters);
  const isWorkspaceLoading = useAppSelector(selectDashboardLoading);

  const applySearchQuery = (query: string) => {
    dispatch(setProjectSearchQuery(query));
  };

  const clearSearchFilter = () => {
    dispatch(setProjectSearchQuery(""));
  };

  const loadProjectSession = (projectId: string) => {
    console.log(`[Dashboard Context Router] Initiating workspace context switch for project GUID: ${projectId}`);
    // Router redirect execution hooks mount cleanly right here
  };

  return {
    projects,
    searchQuery: filters.projectQuery,
    isLoading: isWorkspaceLoading,
    applySearchQuery,
    clearSearchFilter,
    loadProjectSession
  };
}