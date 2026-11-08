// DependencyInjection/InfrastructureServiceRegistration.cs

using DeviceDiscoveryService.Application.Interfaces;
using DeviceDiscoveryService.Domain.Repositories;
using DeviceDiscoveryService.Domain.Services;
using DeviceDiscoveryService.Infrastructure.Configuration;
using DeviceDiscoveryService.Infrastructure.Integrations.GatewayDiscoveryIntegration;
using DeviceDiscoveryService.Infrastructure.Integrations.ProjectDesignIntegration;
using DeviceDiscoveryService.Infrastructure.Persistence;
using DeviceDiscoveryService.Infrastructure.Persistence.Providers;
using DeviceDiscoveryService.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace DeviceDiscoveryService.Infrastructure.DependencyInjection;

public static class InfrastructureServiceRegistration
{
    public static IServiceCollection AddInfrastructureLayer(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // ── Options ──────────────────────────────────────────────────
        services.Configure<DeviceDiscoveryPersistenceOptions>(
            configuration.GetSection(DeviceDiscoveryPersistenceOptions.SectionName));

        services.Configure<DeviceDiscoveryInfrastructureOptions>(
            configuration.GetSection(DeviceDiscoveryInfrastructureOptions.SectionName));

        services.Configure<GatewayDiscoveryOptions>(
            configuration.GetSection(GatewayDiscoveryOptions.SectionName));

        services.Configure<ProjectDesignOptions>(
            configuration.GetSection(ProjectDesignOptions.SectionName));

        var persistence = configuration
            .GetSection(DeviceDiscoveryPersistenceOptions.SectionName)
            .Get<DeviceDiscoveryPersistenceOptions>()
            ?? new DeviceDiscoveryPersistenceOptions();

        var infrastructure = configuration
            .GetSection(DeviceDiscoveryInfrastructureOptions.SectionName)
            .Get<DeviceDiscoveryInfrastructureOptions>()
            ?? new DeviceDiscoveryInfrastructureOptions();

        // ── DbContext ────────────────────────────────────────────────
        services.AddDbContext<DeviceDiscoveryDbContext>(options =>
            options.UseSqlServer(persistence.ConnectionString, b =>
                b.MigrationsAssembly(typeof(DeviceDiscoveryDbContext).Assembly.FullName)));

        // ── Repository ───────────────────────────────────────────────
        services.AddScoped<IDiscoverySessionRepository, DiscoverySessionRepository>();

        // ── Domain services (pure) ───────────────────────────────────
        services.AddScoped<IDeviceIdentificationDomainService, DeviceIdentificationDomainService>();
        services.AddScoped<IDeviceMatchingDomainService, DeviceMatchingDomainService>();

        // ── Cross-cutting ────────────────────────────────────────────
        services.AddSingleton<IDateTimeProvider, SystemDateTimeProvider>();
        services.AddScoped<ICurrentUserProvider, AnonymousCurrentUserProvider>();

        // ── HTTP clients ─────────────────────────────────────────────
        services.AddHttpClient<GatewayDiscoveryClient>(client =>
        {
            client.BaseAddress = new Uri(infrastructure.GatewayManagementBaseUrl);
            client.Timeout = TimeSpan.FromSeconds(infrastructure.TimeoutSeconds);
        });

        services.AddHttpClient<ProjectDesignClient>(client =>
        {
            client.BaseAddress = new Uri(infrastructure.ProjectExplorerBaseUrl);
            client.Timeout = TimeSpan.FromSeconds(infrastructure.TimeoutSeconds);
        });

        // ── Providers: mock or real, chosen by config ────────────────
        if (infrastructure.UseMockIntegrations)
        {
            services.AddScoped<IGatewayDiscoveryProvider, MockGatewayDiscoveryProvider>();
            services.AddScoped<IProjectDesignProvider, MockProjectDesignProvider>();
        }
        else
        {
            services.AddScoped<IGatewayDiscoveryProvider, GatewayDiscoveryProvider>();
            services.AddScoped<IProjectDesignProvider, ProjectDesignProvider>();
        }

        return services;
    }
}