// Persistence/Configurations/DeviceMatchConfiguration.cs

using DeviceDiscoveryService.Domain.Entities;
using DeviceDiscoveryService.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DeviceDiscoveryService.Infrastructure.Persistence.Configurations;

public sealed class DeviceMatchConfiguration : IEntityTypeConfiguration<DeviceMatch>
{
    public void Configure(EntityTypeBuilder<DeviceMatch> builder)
    {
        builder.ToTable("DeviceMatches");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.Id)
            .HasConversion(
                id => id.Value,
                value => new DeviceMatchId(value))
            .ValueGeneratedNever();

        builder.Property(m => m.DeviceId)
            .HasConversion(
                id => id.Value,
                value => DiscoveredDeviceId.From(value))
            .IsRequired();

        builder.Property(m => m.FixtureId).HasMaxLength(128);

        builder.Property(m => m.Status)
            .HasConversion(
                s => s.Value.ToString(),
                value => MatchStatus.FromName(value))
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(m => m.Confidence);
        builder.Property(m => m.MatchedAt).IsRequired();

        // IReadOnlyList<string> Discrepancies — stored as newline-separated text
        var discrepanciesComparer = new ValueComparer<IReadOnlyList<string>>(
            (a, b) => a != null && b != null && a.SequenceEqual(b),
            v => v.Aggregate(0, (h, x) => HashCode.Combine(h, x.GetHashCode())),
            v => (IReadOnlyList<string>)v.ToList().AsReadOnly());

        builder.Property(m => m.Discrepancies)
            .HasColumnName("Discrepancies")
            .HasConversion(
                v => string.Join('\n', v),
                v => v.Length == 0
                    ? Array.Empty<string>()
                    : v.Split('\n', StringSplitOptions.RemoveEmptyEntries))
            .Metadata.SetValueComparer(discrepanciesComparer);
    }
}