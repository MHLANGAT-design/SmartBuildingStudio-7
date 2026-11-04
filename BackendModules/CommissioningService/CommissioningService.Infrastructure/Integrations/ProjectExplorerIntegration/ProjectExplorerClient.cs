using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace CommissioningService.Infrastructure.Integrations.ProjectExplorerIntegration;

public class ProjectExplorerClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<ProjectExplorerClient> _logger;

    public ProjectExplorerClient(HttpClient httpClient, ILogger<ProjectExplorerClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<bool> ValidateProjectContextAsync(Guid projectId, Guid floorplanId, CancellationToken cancellationToken)
    {
        try
        {
            // Assuming ProjectExplorer has an endpoint to verify project/floorplan mapping
            var response = await _httpClient.GetAsync($"/api/projects/{projectId}/floorplans/{floorplanId}", cancellationToken);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to reach ProjectExplorer for validation.");
            return false;
        }
    }

    public async Task<Guid> GetActiveProjectAsync(Guid floorplanId, CancellationToken cancellationToken)
    {
        var response = await _httpClient.GetAsync($"/api/floorplans/{floorplanId}/project", cancellationToken);
        if (!response.IsSuccessStatusCode) return Guid.Empty;

        var project = await response.Content.ReadFromJsonAsync<ProjectDto>(cancellationToken: cancellationToken);
        return project?.Id ?? Guid.Empty;
    }

    private class ProjectDto
    {
        public Guid Id { get; set; }
    }
}