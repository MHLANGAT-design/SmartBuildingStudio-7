// Integrations/ProjectDesignIntegration/ProjectDesignClient.cs

using System.Net.Http.Json;
using System.Text.Json;

namespace DeviceDiscoveryService.Infrastructure.Integrations.ProjectDesignIntegration;

public sealed class ProjectDesignClient
{
    private readonly HttpClient _http;

    public ProjectDesignClient(HttpClient http)
    {
        _http = http;
    }

    public async Task<string> GetFixturesForFloorplanAsync(
        Guid projectId,
        Guid drawingDocumentId,
        CancellationToken cancellationToken = default)
    {
        var url = $"/api/v1/project-explorer/projects/{projectId}/floorplans/{drawingDocumentId}/fixtures";
        var response = await _http.GetAsync(url, cancellationToken);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadAsStringAsync(cancellationToken);
    }
}