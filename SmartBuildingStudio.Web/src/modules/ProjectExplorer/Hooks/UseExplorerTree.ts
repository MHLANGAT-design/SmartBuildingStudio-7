import { useAppSelector, useAppDispatch } from "@/Application/ConfigureStore";
import { useMemo, useCallback } from "react";
import { 
  expandAllTreeNodes, 
  collapseAllTreeNodes,
  toggleErrorFilter 
} from "@/modules/ProjectExplorer/Store/ProjectExplorerSlice";
import { 
  fetchProjectExplorerTree, 
  deleteExplorerNode, 
  renameExplorerNode 
} from "@/modules/ProjectExplorer/Store/ProjectExplorerThunks";
import { 
  selectAllExplorerNodes, 
  selectSelectedNodeId, 
  selectChildNodesMap, 
  selectRootProjects,
  selectExplorerStatistics,
  selectExplorerFilters,
  selectExplorerLoading
} from "@/modules/ProjectExplorer/Store/ProjectExplorerSelectors";

export function UseExplorerTree() {
  const dispatch = useAppDispatch();

  // Load the live engineering matrix data pools straight from the store selectors
  const nodes = useAppSelector(selectAllExplorerNodes);
  const selectedNodeId = useAppSelector(selectSelectedNodeId);
  const childNodesMap = useAppSelector(selectChildNodesMap);
  const rootProjects = useAppSelector(selectRootProjects);
  const statistics = useAppSelector(selectExplorerStatistics);
  const filters = useAppSelector(selectExplorerFilters);
  const loading = useAppSelector(selectExplorerLoading);
  const refreshTree = useCallback(() => {
    dispatch(fetchProjectExplorerTree() as any);
  }, [dispatch]);

  // 🚀 FIXED: Hardened selector handler explicitly normalising action payloads to bypass undefined slice crashes
  const highlightNode = useCallback((nodeId: string | null) => {
    if (!nodeId) {
      dispatch({ type: "projectExplorer/selectNode", payload: null });
      return;
    }
    
    // Explicitly dispatch the string primitive token safely to unblock switch-case selectors
    dispatch({
      type: "projectExplorer/selectNode",
      payload: String(nodeId)
    });
  }, [dispatch]);

  const toggleExpand = useCallback((nodeId: string) => {
    if (!nodeId) return;
    dispatch({
      type: "projectExplorer/toggleNodeExpansion",
      payload: nodeId
    });
  }, [dispatch]);

  const removeNode = useCallback((nodeId: string) => {
    if (!nodeId) return;
    dispatch(deleteExplorerNode(nodeId) as any);
  }, [dispatch]);

  const updateNodeName = useCallback((nodeId: string, newName: string) => {
    if (!nodeId) return;
    dispatch(renameExplorerNode({ nodeId, newName }) as any);
  }, [dispatch]);
  return {
    nodes,
    selectedNodeId,
    childNodesMap,
    rootProjects,
    statistics,
    filters,
    loading,
    refreshTree,
    highlightNode,
    toggleExpand,
    removeNode,
    updateNodeName,
    expandAll: () => dispatch(expandAllTreeNodes()),
    collapseAll: () => dispatch(collapseAllTreeNodes()),
    toggleErrorsOnly: () => dispatch(toggleErrorFilter())
  };
}
