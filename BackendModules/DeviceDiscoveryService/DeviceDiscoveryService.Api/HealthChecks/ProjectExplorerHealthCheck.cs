// HealthChecks/ProjectExplorerHealthCheck.cs

using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace DeviceDiscoveryService.Api.HealthChecks;

public sealed class ProjectExplorerHealthCheck : IHealthCheck
{
    private readonly IHttpClientFactory _httpFactory;
    private readonly IConfiguration _configuration;

    public ProjectExplorerHealthCheck(
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
        var baseUrl = _configuration["DeviceDiscoveryInfrastructure:ProjectExplorerBaseUrl"];
        if (string.IsNullOrWhiteSpace(baseUrl))
            return HealthCheckResult.Degraded("ProjectExplorerBaseUrl not configured.");

        try
        {
            var client = _httpFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(5);

            var response = await client.GetAsync(
                $"{baseUrl.TrimEnd('/')}/api/v1/project-explorer/tree",
                cancellationToken);

            return response.IsSuccessStatusCode
                ? HealthCheckResult.Healthy("ProjectExplorer is reachable.")
                : HealthCheckResult.Degraded(
                    $"ProjectExplorer returned {response.StatusCode}.");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Degraded(
                "ProjectExplorer health check failed.", ex);
        }
    }
}