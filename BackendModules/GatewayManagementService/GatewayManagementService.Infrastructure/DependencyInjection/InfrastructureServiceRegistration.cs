// GatewayManagementService.Infrastructure/DependencyInjection/InfrastructureServiceRegistration.cs

using GatewayManagementService.Application.Interfaces;
using GatewayManagementService.Domain.Repositories;
using GatewayManagementService.Domain.Services;
using GatewayManagementService.Infrastructure.Audit;
using GatewayManagementService.Infrastructure.Configuration;
using GatewayManagementService.Infrastructure.Integrations.DeviceDiscoveryIntegration;
using GatewayManagementService.Infrastructure.Integrations.GatewayIntegration;
using GatewayManagementService.Infrastructure.Integrations.GatewayIntegration.GatewayCommunication;
using GatewayManagementService.Infrastructure.Integrations.ProjectExplorerIntegration;
using GatewayManagementService.Infrastructure.Persistence;
using GatewayManagementService.Infrastructure.Persistence.Repositories;
using GatewayManagementService.Infrastructure.Realtime;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace GatewayManagementService.Infrastructure.DependencyInjection;

public static class InfrastructureServiceRegistration
{
    public static IServiceCollection AddInfrastructureLayer(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<GatewayInfrastructureOptions>(
            configuration.GetSection(GatewayInfrastructureOptions.SectionName));
        services.Configure<GatewayIntegrationOptions>(
            configuration.GetSection(GatewayIntegrationOptions.SectionName));
        services.Configure<GatewayPersistenceOptions>(
            configuration.GetSection(GatewayPersistenceOptions.SectionName));

        // Persistence
        services.AddDbContext<GatewayManagementDbContext>((sp, options) =>
        {
            var opts = sp.GetRequiredService<IOptions<GatewayPersistenceOptions>>().Value;
            options.UseSqlServer(opts.ConnectionString, sql =>
            {
                sql.CommandTimeout(opts.CommandTimeoutSeconds);
                sql.MigrationsAssembly(typeof(GatewayManagementDbContext).Assembly.FullName);
            });
            if (opts.EnableDetailedErrors)
            {
                options.EnableDetailedErrors();
                options.EnableSensitiveDataLogging();
            }
        });

        services.AddScoped<IGatewayRepository, GatewayRepository>();
        services.AddScoped<GatewayAssignmentRepository>();
        services.AddScoped<GatewayEventRepository>();

        // Domain services
        services.AddScoped<GatewayRegistrationDomainService>();
        services.AddScoped<GatewayConnectionDomainService>();

        // GatewayIntegration subsystem
        services.AddSingleton<GatewayIntegrationConfiguration>();
        services.AddScoped<GatewayIntegrationManager>();

        services.AddHttpClient<HttpGatewayCommunicationProvider>();
        services.AddScoped<TcpGatewayCommunicationProvider>();
        services.AddScoped<MockGatewayCommunicationProvider>(sp =>
        {
            var opts = sp.GetRequiredService<IOptions<GatewayIntegrationOptions>>().Value;
            return new MockGatewayCommunicationProvider(opts.MockPingLatencyMs);
        });

        services.AddScoped<IGatewayIntegrationService, GatewayIntegrationService>();
        services.AddScoped<IGatewayDiagnosticsProvider, GatewayIntegrationHealthMonitor>();

        // Peer integrations
        services.AddHttpClient<ProjectExplorerClient>(client =>
        {
            client.BaseAddress = new Uri(configuration["ServiceUrls:ProjectExplorer"] ?? "http://localhost:5200/");
        });
        services.AddScoped<IProjectExplorerLookup, ProjectContextResolver>();

        services.AddHttpClient<DeviceDiscoveryClient>(client =>
        {
            client.BaseAddress = new Uri(configuration["ServiceUrls:DeviceDiscovery"] ?? "http://localhost:5300/");
        });
        services.AddScoped<DiscoverySessionResolver>();

        // Audit & realtime
        services.AddScoped<GatewayAuditRepository>();
        services.AddScoped<IGatewayAuditService, GatewayAuditService>();
        services.AddScoped<IGatewayProgressPublisher, GatewayStatusPublisher>();
        services.AddScoped<GatewayStatusBroadcaster>();

        return services;
    }
}