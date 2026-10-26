import { useAppSelector, useAppDispatch } from "@/Application/ConfigureStore";
import { createExplorerProject } from "@/modules/ProjectExplorer/Store/ProjectExplorerThunks";
import { selectActiveProjectId, selectRootProjects } from "@/modules/ProjectExplorer/Store/ProjectExplorerSelectors";

export function UseProjects() {
  const dispatch = useAppDispatch();

  const activeProjectId = useAppSelector(selectActiveProjectId);
  const initializedProjects = useAppSelector(selectRootProjects);

  const provisionNewProject = (name: string, code: string, client: string) => {
    dispatch(createExplorerProject({ name, code, client }));
  };

  return {
    activeProjectId,
    projects: initializedProjects,
    hasActiveProject: activeProjectId !== null,
    provisionNewProject
  };
}
