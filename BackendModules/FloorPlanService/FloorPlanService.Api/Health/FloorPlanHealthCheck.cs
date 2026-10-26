using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace FloorPlanService.API.Health;

public sealed class FloorPlanHealthCheck : IHealthCheck
{
    public Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(HealthCheckResult.Healthy("FloorPlan Service OK"));
    }
}
