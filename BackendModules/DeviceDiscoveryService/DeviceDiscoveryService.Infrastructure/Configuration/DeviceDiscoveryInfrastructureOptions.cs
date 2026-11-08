// Configuration/DeviceDiscoveryInfrastructureOptions.cs

namespace DeviceDiscoveryService.Infrastructure.Configuration;

public sealed class DeviceDiscoveryInfrastructureOptions
{
    public const string SectionName = "DeviceDiscoveryInfrastructure";

    /// <summary>
    /// When true, the mock providers are registered — no network calls,
    /// realistic synthetic data. When false, the real HttpClient-based
    /// providers hit GatewayManagement and ProjectExplorer.
    /// </summary>
    public bool UseMockIntegrations { get; set; } = true;

    public string GatewayManagementBaseUrl { get; set; } = "http://localhost:5100";
    public string ProjectExplorerBaseUrl { get; set; } = "http://localhost:5199";
    public int TimeoutSeconds { get; set; } = 30;
}