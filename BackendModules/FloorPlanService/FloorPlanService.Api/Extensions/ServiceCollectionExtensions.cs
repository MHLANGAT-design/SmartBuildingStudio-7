using Microsoft.Extensions.Diagnostics.HealthChecks;
using FloorPlanService.API.Health;

namespace FloorPlanService.API.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApiServices(this IServiceCollection services)
    {
        services.AddHealthChecks().AddCheck<FloorPlanHealthCheck>("floorplan");
        return services;
    }
}
