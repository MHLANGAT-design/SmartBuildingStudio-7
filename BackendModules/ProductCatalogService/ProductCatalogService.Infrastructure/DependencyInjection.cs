using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ProductCatalogService.Application.Interfaces;
using ProductCatalogService.Domain.Repositories;
using ProductCatalogService.Infrastructure.Persistence;
using ProductCatalogService.Infrastructure.ReadServices;
using ProductCatalogService.Infrastructure.Repositories;
using ProductCatalogService.Infrastructure.Services;

namespace ProductCatalogService.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<ProductCatalogDbContext>(options =>
        {
            options.UseNpgsql(configuration.GetConnectionString("ProductCatalog"));
        });

        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<IManufacturerRepository, ManufacturerRepository>();
        services.AddScoped<IProductCategoryRepository, ProductCategoryRepository>();
        services.AddScoped<IProductReadService, ProductReadService>();

        // Concrete service (not behind an interface) that the
        // CatalogImportController injects directly. Scoped to match
        // the DbContext lifetime.
        services.AddScoped<CatalogImportService>();

        // Register MediatR handlers that live in this assembly.
        // Infrastructure-owned handlers (CreateProductCommandHandler)
        // need DbContext access, so they can't live in Application —
        // which means they don't get picked up by AddApplication()'s
        // assembly scan. This second call adds them to MediatR's
        // existing registry (it doesn't replace).
        services.AddMediatR(cfg =>
            cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly));

        return services;
    }
}