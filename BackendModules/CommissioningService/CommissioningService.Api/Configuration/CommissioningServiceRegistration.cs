using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CommissioningService.Api.Configuration;

public static class CommissioningServiceRegistration
{
    public static IServiceCollection AddCommissioningServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Register Options
        services.Configure<CommissioningOptions>(configuration.GetSection(CommissioningOptions.SectionName));

        // NOTE: These are where you will wire up the Application and Infrastructure 
        // once they are built. 
        
        // services.AddApplicationLayer();
        // services.AddInfrastructureLayer(configuration);

        // Register MediatR (assuming handlers will be in the Application assembly)
        // services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(ApplicationMarker).Assembly));

        return services;
    }
}