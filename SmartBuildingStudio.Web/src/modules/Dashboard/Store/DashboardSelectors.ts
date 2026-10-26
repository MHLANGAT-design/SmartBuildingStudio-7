import { RootState } from "@/Application/ConfigureStore";
// Import createSelector to memoize computed array references
import { createSelector } from "@reduxjs/toolkit";

export const selectDashboardState = (state: RootState) => state.dashboard;

export const selectRecentProjects = (state: RootState) => selectDashboardState(state).recentProjects;
export const selectRecentDocuments = (state: RootState) => selectDashboardState(state).recentDocuments;
export const selectSystemHealth = (state: RootState) => selectDashboardState(state).health;
export const selectDashboardLoading = (state: RootState) => selectDashboardState(state).loading;
export const selectDashboardError = (state: RootState) => selectDashboardState(state).error;
export const selectDashboardFilters = (state: RootState) => selectDashboardState(state).activeFilters;
export const selectAllActivities = (state: RootState) => selectDashboardState(state).activities;

/**
 * Memoized Selector: Filters projects reactively based on user inputs
 */
export const selectFilteredProjects = createSelector(
  [selectRecentProjects, selectDashboardFilters],
  (projects, filters) => {
    const { projectQuery } = filters;
    if (!projectQuery.trim()) return projects;
    
    const query = projectQuery.toLowerCase();
    return projects.filter(
      (p) => p.name.toLowerCase().includes(query) || p.clientName.toLowerCase().includes(query)
    );
  }
);

/**
 * Memoized Selector: Filters operations telemetry stream based on error level selections
 */
export const selectFilteredActivities = createSelector(
  [selectAllActivities, selectDashboardFilters],
  (activities, filters) => {
    const { activitySeverity } = filters;
    if (activitySeverity === "All") return activities;
    
    return activities.filter((act) => act.status === activitySeverity);
  }
);
