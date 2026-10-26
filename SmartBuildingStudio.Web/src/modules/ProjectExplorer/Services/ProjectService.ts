import { Project } from '@/modules/ProjectExplorer/Models';

export class ProjectService {
  public readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  public async getProjects(): Promise<Project[]> {
    const response = await fetch(`${this.baseUrl}/v1/project-explorer/projects`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('[ProjectService] Failed to load project database items.');
    }

    return await response.json();
  }

  public async createProject(payload: { name: string; description: string; clientName: string }): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/v1/project-explorer/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('[ProjectService] Could not write new project tracking profile.');
    }

    return await response.json();
  }

  public async updateProject(projectId: string, payload: { name: string; description: string; isArchived: boolean }): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/v1/project-explorer/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`[ProjectService] Configuration save failed for project: ${projectId}`);
    }

    return await response.json();
  }

  public async deleteProject(projectId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/v1/project-explorer/projects/${projectId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`[ProjectService] System restriction prevented deletion of target: ${projectId}`);
    }
  }
}
