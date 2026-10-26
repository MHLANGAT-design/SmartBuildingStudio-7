import { Project, ExplorerStatistics } from '@/modules/ProjectExplorer/Models';
import { ProjectService } from '@/modules/ProjectExplorer/Services/ProjectService';
import { BuildingService } from '@/modules/ProjectExplorer/Services/BuildingService';
import { FloorService } from '@/modules/ProjectExplorer/Services/FloorService';
import { DocumentService } from '@/modules/ProjectExplorer/Services/DocumentService';

export class ProjectExplorerApi {
  public readonly projects: ProjectService;
  public readonly buildings: BuildingService;
  public readonly floors: FloorService;
  public readonly documents: DocumentService;

  constructor(baseUrl: string) {
    this.projects = new ProjectService(baseUrl);
    this.buildings = new BuildingService(baseUrl);
    this.floors = new FloorService(baseUrl);
    this.documents = new DocumentService(baseUrl);
  }

  public async getAllProjects(): Promise<Project[]> {
    return await this.projects.getProjects();
  }

  public async getExplorerStatistics(targetId: string): Promise<ExplorerStatistics> {
    const response = await fetch(`${this.projects.baseUrl}/v1/project-explorer/statistics/${targetId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`[ProjectExplorerApi] Failed to resolve system statistics for node: ${targetId}`);
    }

    return await response.json();
  }

  public async deleteProject(projectId: string): Promise<void> {
    await this.projects.deleteProject(projectId);
  }
}
