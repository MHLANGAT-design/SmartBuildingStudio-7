// Persistence/DeviceDiscoveryDbContextFactory.cs

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace DeviceDiscoveryService.Infrastructure.Persistence;

/// <summary>
/// Design-time factory for the `dotnet ef` CLI. Provides a DbContext
/// instance without the API project's Program.cs / DI container.
/// Not used at runtime.
/// </summary>
public sealed class DeviceDiscoveryDbContextFactory : IDesignTimeDbContextFactory<DeviceDiscoveryDbContext>
{
    public DeviceDiscoveryDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .Build();

        var connectionString = configuration["DeviceDiscoveryPersistence:ConnectionString"]
            ?? @"Server=(localdb)\MSSQLLocalDB;Database=DeviceDiscoveryDb;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true";

        var optionsBuilder = new DbContextOptionsBuilder<DeviceDiscoveryDbContext>();
        optionsBuilder.UseSqlServer(connectionString, b =>
            b.MigrationsAssembly(typeof(DeviceDiscoveryDbContext).Assembly.FullName));

        return new DeviceDiscoveryDbContext(optionsBuilder.Options);
    }
}