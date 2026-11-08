// Configuration/DeviceDiscoveryPersistenceOptions.cs

namespace DeviceDiscoveryService.Infrastructure.Configuration;

public sealed class DeviceDiscoveryPersistenceOptions
{
    public const string SectionName = "DeviceDiscoveryPersistence";

    /// <summary>
    /// Connection string for the DeviceDiscoveryDb. Falls back to LocalDB
    /// with an absolute path if not set explicitly.
    /// </summary>
    public string ConnectionString { get; set; } =
        @"Server=(localdb)\MSSQLLocalDB;Database=DeviceDiscoveryDb;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true";
}