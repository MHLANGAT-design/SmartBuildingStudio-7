using System.Reflection;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace ProductCatalogService.Application;

/// <summary>
/// Composition root for the Application layer. Registers MediatR
/// handlers, FluentValidation validators, and any Application-layer
/// services. Called from the Api composition root via
/// services.AddApplication().
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();

        // MediatR — registers all IRequestHandler<TRequest, TResponse>
        // and INotificationHandler<TNotification> in this assembly.
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(assembly);
        });

        // FluentValidation — registers all AbstractValidator<T> in
        // this assembly.
        services.AddValidatorsFromAssembly(assembly);

        return services;
    }
}