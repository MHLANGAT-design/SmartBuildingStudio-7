using FloorPlanService.Domain.Interfaces;
using FloorPlanService.Infrastructure.Persistence;
using FloorPlanService.Infrastructure.Repositories;
using FloorPlanService.Application.Interfaces; // 🚀 Added to resolve parser contract interfaces
using FloorPlanService.Infrastructure.Parser;     // 🚀 Added to resolve DxfImportService mapping engines
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FloorPlanService.Infrastructure;

public static class InfrastructureServiceExtensions
{
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<FloorPlanDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection"),
                b => b.MigrationsAssembly(typeof(FloorPlanDbContext).Assembly.FullName)));

        services.AddScoped<IFloorPlanRepository, FloorPlanRepository>();

        // 🚀 REGISTER CRISP VECTOR PARSING ENGINE SERVICE MAPPINGS
        // Completely isolates netDxf processing wrappers straight within the infrastructure tracking layers.
        services.AddScoped<IDxfImportService, DxfImportService>();

        return services;
    }
}
