// GatewayManagementService.Infrastructure/Integrations/ProjectExplorerIntegration/ProjectExplorerClient.cs

using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace GatewayManagementService.Infrastructure.Integrations.ProjectExplorerIntegration;

public sealed class ProjectExplorerClient
{
    private readonly HttpClient _http;

    public ProjectExplorerClient(HttpClient http)
    {
        _http = http;
    }

    public async Task<ProjectLookupResponse?> GetProjectAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        var response = await _http.GetAsync($"api/v1/project-explorer/projects/{projectId}", cancellationToken);
        if (!response.IsSuccessStatusCode) return null;
        return await response.Content.ReadFromJsonAsync<ProjectLookupResponse>(cancellationToken: cancellationToken);
    }

    public async Task<FloorLookupResponse?> GetFloorAsync(Guid floorId, CancellationToken cancellationToken = default)
    {
        var response = await _http.GetAsync($"api/v1/project-explorer/floors/{floorId}", cancellationToken);
        if (!response.IsSuccessStatusCode) return null;
        return await response.Content.ReadFromJsonAsync<FloorLookupResponse>(cancellationToken: cancellationToken);
    }
}

public sealed class ProjectLookupResponse
{
    [JsonPropertyName("id")] public Guid Id { get; set; }
    [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
}

public sealed class FloorLookupResponse
{
    [JsonPropertyName("id")] public Guid Id { get; set; }
    [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
}