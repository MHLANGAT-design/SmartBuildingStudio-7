// GatewayManagementService.Infrastructure/Configuration/GatewayIntegrationOptions.cs

namespace GatewayManagementService.Infrastructure.Configuration;

public sealed class GatewayIntegrationOptions
{
    public const string SectionName = "GatewayIntegration";

    public bool UseMock { get; set; } = true;
    public int HealthCheckIntervalSeconds { get; set; } = 30;
    public int MaxReconnectAttempts { get; set; } = 5;
    public int ReconnectInitialDelayMs { get; set; } = 2000;
    public double ReconnectBackoffMultiplier { get; set; } = 2.0;
    public string MockProviderPrefix { get; set; } = "mock://";
    public int MockPingLatencyMs { get; set; } = 40;
    public int MockDiagnosticsLatencyMs { get; set; } = 120;
}