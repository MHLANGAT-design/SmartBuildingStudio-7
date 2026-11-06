// GatewayManagementService.Infrastructure/Integrations/ProjectExplorerIntegration/ProjectContextResolver.cs

using GatewayManagementService.Application.Interfaces;

namespace GatewayManagementService.Infrastructure.Integrations.ProjectExplorerIntegration;

public sealed class ProjectContextResolver : IProjectExplorerLookup
{
    private readonly ProjectExplorerClient _client;

    public ProjectContextResolver(ProjectExplorerClient client)
    {
        _client = client;
    }

    public async Task<string?> GetProjectNameAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        var project = await _client.GetProjectAsync(projectId, cancellationToken);
        return project?.Name;
    }

    public async Task<string?> GetFloorNameAsync(Guid floorId, CancellationToken cancellationToken = default)
    {
        var floor = await _client.GetFloorAsync(floorId, cancellationToken);
        return floor?.Name;
    }
}