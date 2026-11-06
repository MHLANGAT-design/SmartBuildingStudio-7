// GatewayManagementService.Api/Configuration/GatewayManagementServiceRegistration.cs

using GatewayManagementService.Application.DependencyInjection;
using GatewayManagementService.Infrastructure.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace GatewayManagementService.Api.Configuration;

public static class GatewayManagementServiceRegistration
{
    public static IServiceCollection AddGatewayManagementServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Options
        services.Configure<GatewayManagementOptions>(
            configuration.GetSection(GatewayManagementOptions.SectionName));

        // Application layer (MediatR, FluentValidation, behaviors)
        services.AddApplicationLayer();

        // Infrastructure layer (DbContext, repositories, GatewayIntegration subsystem, peer clients)
        services.AddInfrastructureLayer(configuration);

        return services;
    }
}