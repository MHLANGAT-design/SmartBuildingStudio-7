using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace CommissioningService.Infrastructure.Integrations.GatewayIntegration;

public class GatewayManagementClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<GatewayManagementClient> _logger;

    public GatewayManagementClient(HttpClient httpClient, ILogger<GatewayManagementClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<bool> PingAsync(string gatewayId, CancellationToken cancellationToken)
    {
        try
        {
            var response = await _httpClient.GetAsync($"/api/gateways/{gatewayId}/ping", cancellationToken);
            return response.IsSuccessStatusCode;
        }
        catch (HttpRequestException)
        {
            return false;
        }
    }

    public async Task SendCommandAsync(string gatewayId, string command, CancellationToken cancellationToken)
    {
        var payload = new { command = command };
        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        
        var response = await _httpClient.PostAsync($"/api/gateways/{gatewayId}/commands", content, cancellationToken);
        
        if (!response.IsSuccessStatusCode)
        {
            var errorDetails = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError("Gateway {GatewayId} returned error {StatusCode}: {Details}", gatewayId, response.StatusCode, errorDetails);
            response.EnsureSuccessStatusCode();
        }
    }
}