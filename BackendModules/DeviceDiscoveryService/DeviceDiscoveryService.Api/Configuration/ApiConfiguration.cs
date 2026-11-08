// Configuration/ApiConfiguration.cs

namespace DeviceDiscoveryService.Api.Configuration;

public sealed class ApiConfiguration
{
    public const string SectionName = "Api";

    public string ServiceName { get; set; } = "DeviceDiscoveryService";
    public bool EnableSwagger { get; set; } = true;
    public string[] CorsOrigins { get; set; } = Array.Empty<string>();
}