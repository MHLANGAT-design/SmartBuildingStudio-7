using System;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

namespace CommissioningService.Infrastructure.Integrations.DeviceDiscoveryIntegration;

public class DeviceDiscoveryClient
{
    private readonly HttpClient _httpClient;
    public DeviceDiscoveryClient(HttpClient httpClient) => _httpClient = httpClient;

    public async Task<string> TriggerScanAsync(string gatewayId, string lineId, CancellationToken cancellationToken)
    {
        var response = await _httpClient.PostAsync($"/api/discovery/{gatewayId}/{lineId}/scan", null, cancellationToken);
        return await response.Content.ReadAsStringAsync(cancellationToken);
    }
}