import { useAppSelector, useAppDispatch } from "@/Application/ConfigureStore";
import { updateExplorerSearch } from "@/modules/ProjectExplorer/Store/ProjectExplorerSlice";
import { selectExplorerFilters } from "@/modules/ProjectExplorer/Store/ProjectExplorerSelectors";

export function UseExplorerSearch() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectExplorerFilters);

  const applySearch = (query: string) => {
    dispatch(updateExplorerSearch(query));
  };

  const clearSearch = () => {
    dispatch(updateExplorerSearch(""));
  };

  return {
    searchQuery: filters.searchQuery,
    showOnlyErrors: filters.showOnlyErrors,
    applySearch,
    clearSearch
  };
}
