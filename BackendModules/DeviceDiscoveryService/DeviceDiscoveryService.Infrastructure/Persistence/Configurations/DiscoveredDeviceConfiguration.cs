// Persistence/Configurations/DiscoveredDeviceConfiguration.cs

using DeviceDiscoveryService.Domain.Entities;
using DeviceDiscoveryService.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DeviceDiscoveryService.Infrastructure.Persistence.Configurations;

public sealed class DiscoveredDeviceConfiguration : IEntityTypeConfiguration<DiscoveredDevice>
{
    public void Configure(EntityTypeBuilder<DiscoveredDevice> builder)
    {
        builder.ToTable("DiscoveredDevices");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.Id)
            .HasConversion(
                id => id.Value,
                value => DiscoveredDeviceId.From(value))
            .ValueGeneratedNever();

        builder.Property(d => d.ExternalId).HasMaxLength(128).IsRequired();

        // Address — owned value object (LineId + ShortAddress)
        builder.OwnsOne(d => d.Address, addr =>
        {
            addr.Property(x => x.LineId)
                .HasColumnName("LineId")
                .HasMaxLength(128)
                .IsRequired();

            addr.Property(x => x.ShortAddress)
                .HasColumnName("ShortAddress");
        });

        builder.Property(d => d.IsOnline).IsRequired();
        builder.Property(d => d.FirstSeenAt).IsRequired();
        builder.Property(d => d.LastSeenAt).IsRequired();

        builder.HasOne(d => d.Identification)
            .WithOne()
            .HasForeignKey<DeviceIdentification>("DiscoveredDeviceId")
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(d => d.Match)
            .WithOne()
            .HasForeignKey<DeviceMatch>("DiscoveredDeviceId")
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(d => new { d.ExternalId });
    }
}