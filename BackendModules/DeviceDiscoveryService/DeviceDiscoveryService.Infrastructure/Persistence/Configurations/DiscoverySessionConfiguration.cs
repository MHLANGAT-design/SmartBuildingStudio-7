// Persistence/Configurations/DiscoverySessionConfiguration.cs

using DeviceDiscoveryService.Domain.Aggregates;
using DeviceDiscoveryService.Domain.Entities;
using DeviceDiscoveryService.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DeviceDiscoveryService.Infrastructure.Persistence.Configurations;

public sealed class DiscoverySessionConfiguration : IEntityTypeConfiguration<DiscoverySession>
{
    public void Configure(EntityTypeBuilder<DiscoverySession> builder)
    {
        builder.ToTable("DiscoverySessions");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Id)
            .HasConversion(
                id => id.Value,
                value => DiscoverySessionId.From(value))
            .ValueGeneratedNever();

        builder.Property(s => s.ProjectId).IsRequired();
        builder.Property(s => s.BuildingId).IsRequired();
        builder.Property(s => s.FloorId).IsRequired();
        builder.Property(s => s.DrawingDocumentId).IsRequired();

        builder.Property(s => s.Status)
            .HasConversion(
                s => s.Value.ToString(),
                value => DiscoveryStatus.FromName(value))
            .HasColumnName("Status")
            .HasMaxLength(32)
            .IsRequired();

        // DiscoveryScope — owned value object
        builder.OwnsOne(s => s.Scope, scope =>
        {
            scope.Property(x => x.GatewayId)
                .HasColumnName("GatewayId")
                .HasMaxLength(128)
                .IsRequired();

            // Value comparer for the IReadOnlyCollection<string> — EF needs
            // it because HasConversion turns the collection into a string,
            // and without a comparer EF can't tell when the collection has
            // been modified (falls back to reference equality).
            var lineIdsComparer = new ValueComparer<IReadOnlyCollection<string>>(
                (a, b) => a != null && b != null && a.SequenceEqual(b),
                v => v.Aggregate(0, (h, x) => HashCode.Combine(h, x.GetHashCode())),
                v => (IReadOnlyCollection<string>)v.ToList().AsReadOnly());

            scope.Property(x => x.LineIds)
                .HasColumnName("LineIds")
                .HasConversion(
                    v => string.Join(';', v),
                    v => v.Length == 0
                        ? new List<string>().AsReadOnly()
                        : v.Split(';', StringSplitOptions.RemoveEmptyEntries).ToList().AsReadOnly())
                .Metadata.SetValueComparer(lineIdsComparer);

            scope.Property(x => x.LineIds).IsRequired();
        });

        builder.Property(s => s.StartedBy).HasMaxLength(256);
        builder.Property(s => s.CreatedAt).IsRequired();
        builder.Property(s => s.StartedAt);
        builder.Property(s => s.CompletedAt);
        builder.Property(s => s.FailedAt);
        builder.Property(s => s.FailureReason).HasMaxLength(2000);

        // Children
        builder.HasMany(s => s.Devices)
            .WithOne()
            .HasForeignKey("DiscoverySessionId")
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(s => s.History)
            .WithOne()
            .HasForeignKey("DiscoverySessionId")
            .OnDelete(DeleteBehavior.Cascade);

        builder.Metadata
            .FindNavigation(nameof(DiscoverySession.Devices))!
            .SetPropertyAccessMode(PropertyAccessMode.Field);

        builder.Metadata
            .FindNavigation(nameof(DiscoverySession.History))!
            .SetPropertyAccessMode(PropertyAccessMode.Field);

        builder.HasIndex(s => s.ProjectId);
        builder.HasIndex(s => s.FloorId);
        builder.HasIndex(s => s.CreatedAt);
    }
}