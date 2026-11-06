// GatewayManagementService.Infrastructure/Configuration/GatewayInfrastructureOptions.cs

namespace GatewayManagementService.Infrastructure.Configuration;

public sealed class GatewayInfrastructureOptions
{
    public const string SectionName = "GatewayInfrastructure";

    public bool UseMockIntegrations { get; set; } = true;
    public int DefaultPollingIntervalSeconds { get; set; } = 15;
    public int DefaultCommandTimeoutSeconds { get; set; } = 30;
}