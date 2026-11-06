// GatewayManagementService.Application/Interfaces/IProjectExplorerLookup.cs

namespace GatewayManagementService.Application.Interfaces;

/// <summary>
/// Read-only lookup into ProjectExplorer. Used to resolve project names,
/// building names, and floor names when rendering gateway assignments.
/// </summary>
public interface IProjectExplorerLookup
{
    Task<string?> GetProjectNameAsync(Guid projectId, CancellationToken cancellationToken = default);
    Task<string?> GetFloorNameAsync(Guid floorId, CancellationToken cancellationToken = default);
}