using Microsoft.EntityFrameworkCore;
using CommissioningService.Domain.Aggregates;
using CommissioningService.Domain.Entities;

namespace CommissioningService.Infrastructure.Persistence;

public class CommissioningDbContext : DbContext
{
    public DbSet<CommissioningSession> Sessions { get; set; }
    public DbSet<CommissioningDevice> Devices { get; set; }
    public DbSet<CommissioningDefect> Defects { get; set; }
    public DbSet<CommissioningTest> Tests { get; set; }
    public DbSet<CommissioningTestResult> TestResults { get; set; }

    public CommissioningDbContext(DbContextOptions<CommissioningDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CommissioningDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}