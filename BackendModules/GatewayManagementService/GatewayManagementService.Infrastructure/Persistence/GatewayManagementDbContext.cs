// GatewayManagementService.Infrastructure/Persistence/GatewayManagementDbContext.cs

using GatewayManagementService.Domain.Aggregates;
using GatewayManagementService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GatewayManagementService.Infrastructure.Persistence;

public sealed class GatewayManagementDbContext : DbContext
{
    public GatewayManagementDbContext(DbContextOptions<GatewayManagementDbContext> options)
        : base(options) { }

    public DbSet<Gateway> Gateways => Set<Gateway>();
    public DbSet<GatewayOperation> GatewayOperations => Set<GatewayOperation>();
    public DbSet<GatewayEvent> GatewayEvents => Set<GatewayEvent>();
    public DbSet<GatewayConnectionRecord> GatewayConnectionRecords => Set<GatewayConnectionRecord>();
    public DbSet<GatewayAssignment> GatewayAssignments => Set<GatewayAssignment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(GatewayManagementDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}