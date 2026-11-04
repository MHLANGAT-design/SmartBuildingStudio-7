using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace CommissioningService.Infrastructure.Integrations.ProjectExplorerIntegration;

public class ProjectContextResolver
{
    private readonly ProjectExplorerClient _client;
    private readonly ILogger<ProjectContextResolver> _logger;

    public ProjectContextResolver(ProjectExplorerClient client, ILogger<ProjectContextResolver> logger)
    {
        _client = client;
        _logger = logger;
    }

    public async Task EnsureContextIsValidAsync(Guid projectId, Guid floorplanId, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Resolving project context for Project {ProjectId} and Floorplan {FloorplanId}", projectId, floorplanId);
        
        var isValid = await _client.ValidateProjectContextAsync(projectId, floorplanId, cancellationToken);
        
        if (!isValid)
        {
            _logger.LogWarning("Context validation failed for Project {ProjectId} and Floorplan {FloorplanId}", projectId, floorplanId);
            throw new InvalidOperationException($"Invalid project ({projectId}) or floorplan ({floorplanId}) context.");
        }
    }
}