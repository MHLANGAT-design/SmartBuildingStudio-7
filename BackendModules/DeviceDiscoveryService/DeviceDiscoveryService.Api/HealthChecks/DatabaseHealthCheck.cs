// HealthChecks/DatabaseHealthCheck.cs

using DeviceDiscoveryService.Infrastructure.Persistence;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace DeviceDiscoveryService.Api.HealthChecks;

public sealed class DatabaseHealthCheck : IHealthCheck
{
    private readonly DeviceDiscoveryDbContext _db;

    public DatabaseHealthCheck(DeviceDiscoveryDbContext db) => _db = db;

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var canConnect = await _db.Database.CanConnectAsync(cancellationToken);
            return canConnect
                ? HealthCheckResult.Healthy("DeviceDiscoveryDb is reachable.")
                : HealthCheckResult.Unhealthy("DeviceDiscoveryDb is not reachable.");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("DeviceDiscoveryDb check failed.", ex);
        }
    }
}