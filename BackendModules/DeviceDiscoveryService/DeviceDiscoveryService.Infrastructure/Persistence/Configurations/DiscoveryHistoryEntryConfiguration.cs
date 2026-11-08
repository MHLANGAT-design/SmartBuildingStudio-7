// Persistence/Configurations/DiscoveryHistoryEntryConfiguration.cs

using DeviceDiscoveryService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DeviceDiscoveryService.Infrastructure.Persistence.Configurations;

public sealed class DiscoveryHistoryEntryConfiguration
    : IEntityTypeConfiguration<DiscoveryHistoryEntry>
{
    public void Configure(EntityTypeBuilder<DiscoveryHistoryEntry> builder)
    {
        builder.ToTable("DiscoveryHistoryEntries");

        builder.HasKey(h => h.Id);
        builder.Property(h => h.EventType).HasMaxLength(64).IsRequired();
        builder.Property(h => h.Details).HasMaxLength(2000);
        builder.Property(h => h.OccurredAt).IsRequired();

        builder.HasIndex(h => h.OccurredAt);
    }
}