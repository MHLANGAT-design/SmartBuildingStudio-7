// Integrations/GatewayDiscoveryIntegration/GatewayDiscoveryOptions.cs

namespace DeviceDiscoveryService.Infrastructure.Integrations.GatewayDiscoveryIntegration;

public sealed class GatewayDiscoveryOptions
{
    public const string SectionName = "GatewayDiscovery";

    public string BaseUrl { get; set; } = "http://localhost:5100";
    public int TimeoutSeconds { get; set; } = 30;
}