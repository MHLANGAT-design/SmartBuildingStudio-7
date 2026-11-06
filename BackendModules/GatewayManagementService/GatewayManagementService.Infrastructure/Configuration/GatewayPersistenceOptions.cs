// GatewayManagementService.Infrastructure/Configuration/GatewayPersistenceOptions.cs

namespace GatewayManagementService.Infrastructure.Configuration;

public sealed class GatewayPersistenceOptions
{
    public const string SectionName = "GatewayPersistence";

    public string ConnectionString { get; set; } = string.Empty;
    public bool EnableDetailedErrors { get; set; } = false;
    public int CommandTimeoutSeconds { get; set; } = 30;
}