// DependencyInjection.cs

using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using DeviceDiscoveryService.Application.Behaviors;

namespace DeviceDiscoveryService.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationLayer(this IServiceCollection services)
    {
        // MediatR — scan this assembly for handlers, validators, behaviors
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly);
        });

        // FluentValidation — scan this assembly for validators
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

        // Cross-cutting pipeline behaviors
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(PerformanceBehavior<,>));

        return services;
    }
}