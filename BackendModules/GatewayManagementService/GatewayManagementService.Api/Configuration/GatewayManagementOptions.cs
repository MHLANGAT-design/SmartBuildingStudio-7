// GatewayManagementService.Api/Configuration/GatewayManagementOptions.cs

namespace GatewayManagementService.Api.Configuration;

public sealed class GatewayManagementOptions
{
    public const string SectionName = "GatewayManagement";

    public string ServiceName { get; set; } = "GatewayManagementService";
    public string ServiceVersion { get; set; } = "1.0.0";
    public bool EnableSwagger { get; set; } = true;
    public string? CorsOrigin { get; set; }
}