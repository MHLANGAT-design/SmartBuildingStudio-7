// Integrations/GatewayDiscoveryIntegration/GatewayDiscoveryClient.cs

using System.Net.Http.Json;
using System.Text.Json;

namespace DeviceDiscoveryService.Infrastructure.Integrations.GatewayDiscoveryIntegration;

/// <summary>
/// Low-level HttpClient wrapper around GatewayManagement's operation endpoint.
/// The real provider uses this; the mock provider doesn't.
/// </summary>
public sealed class GatewayDiscoveryClient
{
    private readonly HttpClient _http;

    public GatewayDiscoveryClient(HttpClient http)
    {
        _http = http;
    }

    public async Task<string> TriggerScanAsync(
        string gatewayId,
        string lineId,
        CancellationToken cancellationToken = default)
    {
        var body = new
        {
            operationType = "ScanLine",
            payload = JsonSerializer.Serialize(new { lineId }),
        };

        var response = await _http.PostAsJsonAsync(
            $"/api/v1/gateways/{gatewayId}/operations",
            body,
            cancellationToken);

        response.EnsureSuccessStatusCode();
        return await response.Content.ReadAsStringAsync(cancellationToken);
    }

    public async Task<bool> PingAsync(string gatewayId, CancellationToken cancellationToken = default)
    {
        var response = await _http.PostAsync(
            $"/api/v1/gateway-integration/{gatewayId}/ping",
            null,
            cancellationToken);
        return response.IsSuccessStatusCode;
    }
}