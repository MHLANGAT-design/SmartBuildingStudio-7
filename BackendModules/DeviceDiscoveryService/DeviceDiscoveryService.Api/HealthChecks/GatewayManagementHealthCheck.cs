// HealthChecks/GatewayManagementHealthCheck.cs

using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace DeviceDiscoveryService.Api.HealthChecks;

public sealed class GatewayManagementHealthCheck : IHealthCheck
{
    private readonly IHttpClientFactory _httpFactory;
    private readonly IConfiguration _configuration;

    public GatewayManagementHealthCheck(
        IHttpClientFactory httpFactory,
        IConfiguration configuration)
    {
        _httpFactory = httpFactory;
        _configuration = configuration;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var baseUrl = _configuration["DeviceDiscoveryInfrastructure:GatewayManagementBaseUrl"];
        if (string.IsNullOrWhiteSpace(baseUrl))
            return HealthCheckResult.Degraded("GatewayManagementBaseUrl not configured.");

        try
        {
            var client = _httpFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(5);

            var response = await client.GetAsync(
                $"{baseUrl.TrimEnd('/')}/api/v1/gateway-integration/state",
                cancellationToken);

            return response.IsSuccessStatusCode
                ? HealthCheckResult.Healthy("GatewayManagement is reachable.")
                : HealthCheckResult.Degraded(
                    $"GatewayManagement returned {response.StatusCode}.");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Degraded(
                "GatewayManagement health check failed.", ex);
        }
    }
}