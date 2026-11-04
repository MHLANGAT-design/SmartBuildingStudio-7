using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using CommissioningService.Domain.Repositories;
using CommissioningService.Domain.Services;
using CommissioningService.Application.Interfaces;
using CommissioningService.Infrastructure.Configuration;
using CommissioningService.Infrastructure.Persistence;
using CommissioningService.Infrastructure.Persistence.Repositories;

// Integrations
using CommissioningService.Infrastructure.Integrations.ProjectExplorerIntegration;
using CommissioningService.Infrastructure.Integrations.GatewayIntegration;
using CommissioningService.Infrastructure.Integrations.DeviceDiscoveryIntegration;
using CommissioningService.Infrastructure.Integrations.DaliDesignIntegration;
using CommissioningService.Infrastructure.Integrations.DaliProgrammingIntegration;
using CommissioningService.Infrastructure.Integrations.ReportsIntegration;

// Business Logic Processors
using CommissioningService.Infrastructure.Addressing;
using CommissioningService.Infrastructure.Audit;
using CommissioningService.Infrastructure.FaultManagement;
using CommissioningService.Infrastructure.Network;
using CommissioningService.Infrastructure.Realtime;
using CommissioningService.Infrastructure.Reporting;
using CommissioningService.Infrastructure.Scenes;
using CommissioningService.Infrastructure.Signals;
using CommissioningService.Infrastructure.Testing;

namespace CommissioningService.Infrastructure.DependencyInjection;

public static class InfrastructureServiceRegistration
{
    public static IServiceCollection AddInfrastructureLayer(this IServiceCollection services, IConfiguration configuration)
    {
        // ─── 1. Configuration Options ─────────────────────────────────────
        services.Configure<CommissioningInfrastructureOptions>(configuration.GetSection(CommissioningInfrastructureOptions.SectionName));
        services.Configure<CommissioningPersistenceOptions>(configuration.GetSection(CommissioningPersistenceOptions.SectionName));
        services.Configure<GatewayIntegrationOptions>(configuration.GetSection(GatewayIntegrationOptions.SectionName));

        // ─── 2. Database (EF Core) ────────────────────────────────────────
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Server=localhost;Database=CommissioningDb;Trusted_Connection=True;TrustServerCertificate=True;";

        services.AddDbContext<CommissioningDbContext>(options =>
            options.UseSqlServer(connectionString, b =>
                b.MigrationsAssembly(typeof(CommissioningDbContext).Assembly.FullName)));

        // ─── 3. Repositories (Persistence) ────────────────────────────────
        services.AddScoped<ICommissioningSessionRepository, CommissioningSessionRepository>();

        services.AddScoped<CommissioningDeviceRepository>();
        services.AddScoped<CommissioningTestRepository>();
        services.AddScoped<CommissioningDefectRepository>();
        services.AddScoped<CommissioningService.Infrastructure.Persistence.Repositories.CommissioningReportRepository>();
        services.AddScoped<FaultHistoryRepository>();
        services.AddScoped<SignalLogRepository>();

        // ─── 4. Integration HTTP Clients ──────────────────────────────────
        var gatewayOptions = configuration.GetSection(GatewayIntegrationOptions.SectionName).Get<GatewayIntegrationOptions>();

        services.AddHttpClient<ProjectExplorerClient>(client =>
        {
            client.BaseAddress = new Uri(configuration["Services:ProjectExplorerUrl"] ?? "http://localhost:5001");
            client.Timeout = TimeSpan.FromSeconds(30);
        });

        services.AddHttpClient<GatewayManagementClient>(client =>
        {
            client.BaseAddress = new Uri(gatewayOptions?.BaseUrl ?? "http://localhost:5002");
            client.Timeout = TimeSpan.FromSeconds(gatewayOptions?.TimeoutSeconds ?? 30);
        });

        services.AddHttpClient<DeviceDiscoveryClient>(client =>
        {
            client.BaseAddress = new Uri(configuration["Services:DeviceDiscoveryUrl"] ?? "http://localhost:5003");
        });

        services.AddHttpClient<DaliDesignClient>(client =>
        {
            client.BaseAddress = new Uri(configuration["Services:DaliDesignerUrl"] ?? "http://localhost:5004");
        });

        services.AddHttpClient<DaliProgrammingClient>(client =>
        {
            client.BaseAddress = new Uri(configuration["Services:DaliProgrammingUrl"] ?? "http://localhost:5005");
        });

        services.AddHttpClient<ReportsClient>(client =>
        {
            client.BaseAddress = new Uri(configuration["Services:ReportsUrl"] ?? "http://localhost:5006");
        });

        // ─── 5. Integration Providers (Adapters) ──────────────────────────
        services.AddScoped<ProjectContextResolver>();
        services.AddScoped<DeviceDiscoveryProvider>();
        services.AddScoped<IDeviceDiscoveryProvider>(sp => sp.GetRequiredService<DeviceDiscoveryProvider>());
        services.AddScoped<DiscoveredDeviceMapper>();

        services.AddScoped<GatewayCommunicationProvider>();
        services.AddScoped<IGatewayCommunicationProvider>(sp => sp.GetRequiredService<GatewayCommunicationProvider>());
        services.AddScoped<GatewayHealthProvider>();
        services.AddScoped<GatewayResponseMapper>();
        services.AddScoped<GatewaySessionManager>();

        // Programming providers
        services.AddScoped<GatewayProgrammingProvider>();
        services.AddScoped<IGatewayProgrammingProvider>(sp => sp.GetRequiredService<GatewayProgrammingProvider>());

        services.AddScoped<GatewayVerificationProvider>();
        services.AddScoped<IProgrammingVerificationProvider>(sp => sp.GetRequiredService<GatewayVerificationProvider>());

        services.AddScoped<GatewayDiagnosticsProvider>();
        services.AddScoped<IProgrammingDiagnosticsProvider>(sp => sp.GetRequiredService<GatewayDiagnosticsProvider>());

        services.AddScoped<DaliDesignProvider>();
        services.AddScoped<ICommissioningDesignProvider>(sp => sp.GetRequiredService<DaliDesignProvider>());
        services.AddScoped<DaliDesignRevisionResolver>();

        services.AddScoped<DaliProgrammingProvider>();
        services.AddScoped<IProgrammingResultProvider>(sp => sp.GetRequiredService<DaliProgrammingProvider>());
        services.AddScoped<ProgrammingResultResolver>();

        services.AddScoped<CommissioningReportProvider>();
        services.AddScoped<ICommissioningReportService>(sp => sp.GetRequiredService<CommissioningReportProvider>());

        // ─── 6. Business Logic Processors & Executors ─────────────────────
        services.AddScoped<CommissioningAddressingProvider>();
        services.AddScoped<IAddressingProvider>(sp => sp.GetRequiredService<CommissioningAddressingProvider>());
        services.AddScoped<AddressAssignmentResolver>();
        services.AddScoped<AddressConflictDetector>();
        services.AddScoped<AddressVerificationService>();

        services.AddScoped<CommissioningTestExecutor>();
        services.AddScoped<ICommissioningTestExecutor>(sp => sp.GetRequiredService<CommissioningTestExecutor>());
        services.AddScoped<DeviceFunctionalTestExecutor>();
        services.AddScoped<CommunicationTestExecutor>();
        services.AddScoped<NetworkTestExecutor>();
        services.AddScoped<SceneTestExecutor>();
        services.AddScoped<AddressVerificationExecutor>();
        services.AddScoped<ConfigurationVerificationExecutor>();
        services.AddScoped<SignalVerificationExecutor>();
        services.AddScoped<TestResultProcessor>();

        services.AddScoped<NetworkStateProvider>();
        services.AddScoped<NetworkHealthAnalyzer>();
        services.AddScoped<NetworkTestProvider>();
        services.AddScoped<INetworkTestProvider>(sp => sp.GetRequiredService<NetworkTestProvider>());
        services.AddScoped<NetworkResultProcessor>();

        services.AddScoped<SceneTestProvider>();
        services.AddScoped<ISceneTestProvider>(sp => sp.GetRequiredService<SceneTestProvider>());
        services.AddScoped<SceneExecutionService>();
        services.AddScoped<SceneResultProcessor>();

        services.AddScoped<SignalVerificationProvider>();
        services.AddScoped<SignalResponseProcessor>();

        services.AddScoped<CommissioningFaultDetector>();
        services.AddScoped<FaultClassifier>();
        services.AddScoped<FaultCorrelationService>();
        services.AddScoped<FaultResolutionService>();

        services.AddScoped<CommissioningReportGenerator>();
        services.AddScoped<CommissioningReportExporter>();
        services.AddScoped<CommissioningReportMapper>();

        services.AddScoped<CommissioningAuditService>();
        services.AddScoped<ICommissioningAuditService>(sp => sp.GetRequiredService<CommissioningAuditService>());

        services.AddScoped<CommissioningProgressPublisher>();
        services.AddScoped<ICommissioningProgressPublisher>(sp => sp.GetRequiredService<CommissioningProgressPublisher>());
        services.AddScoped<CommissioningProgressConsumer>();
        services.AddScoped<CommissioningStatusBroadcaster>();

        // ─── 7. Domain Services ──────────────────────────────────────────
        services.AddScoped<CommissioningSessionDomainService>();
        services.AddScoped<CommissioningCompletionDomainService>();
        services.AddScoped<CommissioningDefectDomainService>();

        return services;
    }
}