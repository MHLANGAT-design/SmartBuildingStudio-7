import { useAppSelector, useAppDispatch } from "@/Application/ConfigureStore";
import { setActivitySeverityFilter } from "@/modules/Dashboard/Store/DashboardSlice";
import { selectFilteredActivities, selectDashboardFilters } from "@/modules/Dashboard/Store/DashboardSelectors";
import { DashboardState } from "@/modules/Dashboard/Store/DashboardTypes";

export function UseActivities() {
  const dispatch = useAppDispatch();

  const activities = useAppSelector(selectFilteredActivities);
  const filters = useAppSelector(selectDashboardFilters);

  const updateSeverityFilter = (severity: DashboardState["activeFilters"]["activitySeverity"]) => {
    dispatch(setActivitySeverityFilter(severity));
  };

  return {
    activities,
    activeSeverityFilter: filters.activitySeverity,
    updateSeverityFilter,
    totalCount: activities.length
  };
}
