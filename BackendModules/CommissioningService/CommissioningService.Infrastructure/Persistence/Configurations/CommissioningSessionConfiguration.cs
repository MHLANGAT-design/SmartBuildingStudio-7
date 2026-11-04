using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using CommissioningService.Domain.Aggregates;
using CommissioningService.Domain.ValueObjects;

namespace CommissioningService.Infrastructure.Persistence.Configurations;

public class CommissioningSessionConfiguration : IEntityTypeConfiguration<CommissioningSession>
{
    public void Configure(EntityTypeBuilder<CommissioningSession> builder)
    {
        builder.ToTable("CommissioningSessions");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .HasConversion(
                v => v.Value,
                v => new CommissioningSessionId(v));

        builder.Property(x => x.Status)
            .HasConversion(
                v => v.Value.ToString(),
                v => new CommissioningStatus((CommissioningStatus.StatusValue)System.Enum.Parse(typeof(CommissioningStatus.StatusValue), v)));

        // FIX: Use the actual column names EF Core created during migration.
        // The migration created 'CommissioningSessionId' as the FK column
        // for Devices, Defects, Tests, NetworkStates, and AddressAssignments.
        // For SceneTest and SignalLog, the migration created 'CommissioningSessionId' too.
        builder.HasMany(x => x.Devices)
            .WithOne()
            .HasForeignKey("CommissioningSessionId");

        builder.HasMany(x => x.Defects)
            .WithOne()
            .HasForeignKey("CommissioningSessionId");

        builder.HasMany(x => x.Tests)
            .WithOne()
            .HasForeignKey("CommissioningSessionId");

        builder.HasMany(x => x.NetworkStates)
            .WithOne()
            .HasForeignKey("CommissioningSessionId");

        builder.HasMany(x => x.AddressAssignments)
            .WithOne()
            .HasForeignKey("CommissioningSessionId");

        // These are not explicitly mapped in the aggregate but exist in the DB
        builder.HasMany(x => x.SceneTests)
            .WithOne()
            .HasForeignKey("CommissioningSessionId");

        builder.HasMany(x => x.SignalLogs)
            .WithOne()
            .HasForeignKey("CommissioningSessionId");
    }
}