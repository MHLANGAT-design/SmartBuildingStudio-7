// GatewayManagementService.Application/DependencyInjection/ApplicationServiceRegistration.cs

using FluentValidation;
using GatewayManagementService.Application.Behaviors;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace GatewayManagementService.Application.DependencyInjection;

public static class ApplicationServiceRegistration
{
    /// <summary>
    /// Registers the Application layer (MediatR handlers, FluentValidation
    /// validators, pipeline behaviors). Called by the Api layer via
    /// <see cref="AddApplicationLayer"/>.
    /// </summary>
    public static IServiceCollection AddApplicationLayer(this IServiceCollection services)
    {
        var assembly = typeof(ApplicationMarker).Assembly;

        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(assembly);
            cfg.AddOpenBehavior(typeof(LoggingBehavior<,>));
            cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
            cfg.AddOpenBehavior(typeof(TransactionBehavior<,>));
        });

        services.AddValidatorsFromAssembly(assembly);

        return services;
    }
}