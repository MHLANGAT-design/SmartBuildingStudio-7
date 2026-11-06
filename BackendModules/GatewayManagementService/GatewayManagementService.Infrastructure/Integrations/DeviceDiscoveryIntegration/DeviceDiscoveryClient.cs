// GatewayManagementService.Infrastructure/Integrations/DeviceDiscoveryIntegration/DeviceDiscoveryClient.cs

using System.Net.Http.Json;

namespace GatewayManagementService.Infrastructure.Integrations.DeviceDiscoveryIntegration;

public sealed class DeviceDiscoveryClient
{
    private readonly HttpClient _http;

    public DeviceDiscoveryClient(HttpClient http)
    {
        _http = http;
    }

    public async Task<IReadOnlyList<DiscoverySessionSummary>?> GetSessionsForGatewayAsync(Guid gatewayId, CancellationToken cancellationToken = default)
    {
        var response = await _http.GetAsync($"api/v1/discovery/sessions?gatewayId={gatewayId}", cancellationToken);
        if (!response.IsSuccessStatusCode) return null;
        return await response.Content.ReadFromJsonAsync<List<DiscoverySessionSummary>>(cancellationToken: cancellationToken);
    }
}

public sealed class DiscoverySessionSummary
{
    public Guid Id { get; set; }
    public Guid GatewayId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}