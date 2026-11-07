// BackendModules\CommissioningService\CommissioningService.Infrastructure\
//   Integrations\DeviceDiscoveryIntegration\DeviceDiscoveryClient.cs

using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace CommissioningService.Infrastructure.Integrations.DeviceDiscoveryIntegration;

public class DeviceDiscoveryClient
{
    private readonly HttpClient _httpClient;
    public DeviceDiscoveryClient(HttpClient httpClient) => _httpClient = httpClient;

    public async Task<string> TriggerScanAsync(
        string gatewayId,
        string lineId,
        CancellationToken cancellationToken)
    {
        // GatewayManagement owns the gateway and exposes a generic
        // operation route for hardware actions:
        //
        //   POST /api/v1/gateways/{gatewayId}/operations
        //   body: { operationType: string, payload: string }
        //
        // Commissioning scans a DALI line by issuing a scan operation
        // against the gateway. If GatewayManagement's operation switch
        // uses a different operationType string for line scanning, that
        // single literal is the only thing to adjust here.
        var body = new
        {
            operationType = "ScanLine",
            payload = JsonSerializer.Serialize(new { lineId }),
        };

        var response = await _httpClient.PostAsJsonAsync(
            $"/api/v1/gateways/{gatewayId}/operations",
            body,
            cancellationToken);

        response.EnsureSuccessStatusCode();
        return await response.Content.ReadAsStringAsync(cancellationToken);
    }
}