// GatewayManagementService.Api/Configuration/GatewayManagementApiConfiguration.cs

namespace GatewayManagementService.Api.Configuration;

public sealed class GatewayManagementApiConfiguration
{
    public string ConnectionString { get; set; } = string.Empty;
    public string? ProjectExplorerUrl { get; set; }
    public string? DeviceDiscoveryUrl { get; set; }

    public static GatewayManagementApiConfiguration FromConfiguration(IConfiguration configuration)
    {
        return new GatewayManagementApiConfiguration
        {
            ConnectionString = configuration.GetConnectionString("GatewayManagementDb")
                ?? configuration["GatewayPersistence:ConnectionString"]
                ?? string.Empty,
            ProjectExplorerUrl = configuration["ServiceUrls:ProjectExplorer"],
            DeviceDiscoveryUrl = configuration["ServiceUrls:DeviceDiscovery"]
        };
    }
}