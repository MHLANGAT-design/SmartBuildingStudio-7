// GatewayManagementService.Api/Health/GatewayManagementHealthCheck.cs

using GatewayManagementService.Infrastructure.Persistence;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace GatewayManagementService.Api.Health;

public sealed class GatewayManagementHealthCheck : IHealthCheck
{
    private readonly GatewayManagementDbContext _context;

    public GatewayManagementHealthCheck(GatewayManagementDbContext context)
    {
        _context = context;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var canConnect = await _context.Database.CanConnectAsync(cancellationToken);
            return canConnect
                ? HealthCheckResult.Healthy("GatewayManagement database is reachable.")
                : HealthCheckResult.Unhealthy("GatewayManagement database is unreachable.");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("GatewayManagement database health check failed.", ex);
        }
    }
}