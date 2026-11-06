// GatewayManagementService.Infrastructure/Integrations/GatewayIntegration/GatewayIntegrationConfiguration.cs

using GatewayManagementService.Infrastructure.Configuration;
using Microsoft.Extensions.Options;

namespace GatewayManagementService.Infrastructure.Integrations.GatewayIntegration;

public sealed class GatewayIntegrationConfiguration
{
    public bool UseMock { get; }
    public int HealthCheckIntervalSeconds { get; }
    public int MaxReconnectAttempts { get; }
    public int ReconnectInitialDelayMs { get; }
    public double ReconnectBackoffMultiplier { get; }
    public string MockProviderPrefix { get; }
    public int MockPingLatencyMs { get; }
    public int MockDiagnosticsLatencyMs { get; }

    public GatewayIntegrationConfiguration(IOptions<GatewayIntegrationOptions> options)
    {
        var o = options.Value;
        UseMock = o.UseMock;
        HealthCheckIntervalSeconds = o.HealthCheckIntervalSeconds;
        MaxReconnectAttempts = o.MaxReconnectAttempts;
        ReconnectInitialDelayMs = o.ReconnectInitialDelayMs;
        ReconnectBackoffMultiplier = o.ReconnectBackoffMultiplier;
        MockProviderPrefix = o.MockProviderPrefix;
        MockPingLatencyMs = o.MockPingLatencyMs;
        MockDiagnosticsLatencyMs = o.MockDiagnosticsLatencyMs;
    }
}