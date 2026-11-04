using System.Reflection;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using CommissioningService.Application.Behaviors;

namespace CommissioningService.Application.DependencyInjection;

public static class ApplicationServiceRegistration
{
    public static IServiceCollection AddApplicationLayer(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();

        // Register MediatR (Handlers)
        services.AddMediatR(cfg => 
        {
            cfg.RegisterServicesFromAssembly(assembly);
        });

        // Register FluentValidation (Validators)
        services.AddValidatorsFromAssembly(assembly);

        // Register Pipeline Behaviors (Order matters)
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
        
        // Note: TransactionBehavior requires IUnitOfWork. 
        // We will register the implementation of IUnitOfWork in the Infrastructure layer.

        return services;
    }
}