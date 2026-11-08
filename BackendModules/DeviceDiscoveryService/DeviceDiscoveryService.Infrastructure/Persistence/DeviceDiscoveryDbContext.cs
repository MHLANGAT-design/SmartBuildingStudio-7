// Persistence/DeviceDiscoveryDbContext.cs

using DeviceDiscoveryService.Domain.Aggregates;
using DeviceDiscoveryService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DeviceDiscoveryService.Infrastructure.Persistence;

public sealed class DeviceDiscoveryDbContext : DbContext
{
    public DeviceDiscoveryDbContext(DbContextOptions<DeviceDiscoveryDbContext> options)
        : base(options) { }

    public DbSet<DiscoverySession> DiscoverySessions => Set<DiscoverySession>();
    public DbSet<DiscoveredDevice> DiscoveredDevices => Set<DiscoveredDevice>();
    public DbSet<DeviceIdentification> DeviceIdentifications => Set<DeviceIdentification>();
    public DbSet<DeviceMatch> DeviceMatches => Set<DeviceMatch>();
    public DbSet<DiscoveryHistoryEntry> DiscoveryHistoryEntries => Set<DiscoveryHistoryEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(DeviceDiscoveryDbContext).Assembly);
    }
}