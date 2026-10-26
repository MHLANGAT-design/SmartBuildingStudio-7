using AutoMapper;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using System.Reflection;
using FloorPlanService.Application.UseCases; // 🚀 Added to resolve the handler reference

namespace FloorPlanService.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // Native AutoMapper configuration wrapper
        var mapperConfig = new MapperConfiguration(cfg =>
        {
            cfg.AddMaps(Assembly.GetExecutingAssembly());
        }, NullLoggerFactory.Instance);
        
        IMapper mapper = mapperConfig.CreateMapper();
        services.AddSingleton(mapper);
        
        // Modern configuration expression for MediatR 14+
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly()));
        
        // FluentValidation configuration
        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());
        
        // 🚀 REGISTER OUR COMMAND HANDLER DIRECTLY INTO THE APPLICATION LAYER
        services.AddScoped<ImportFloorPlanCommandHandler>();
        
        return services;
    }
}
