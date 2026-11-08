// Persistence/Configurations/DeviceIdentificationConfiguration.cs

using DeviceDiscoveryService.Domain.Entities;
using DeviceDiscoveryService.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DeviceDiscoveryService.Infrastructure.Persistence.Configurations;

public sealed class DeviceIdentificationConfiguration
    : IEntityTypeConfiguration<DeviceIdentification>
{
    public void Configure(EntityTypeBuilder<DeviceIdentification> builder)
    {
        builder.ToTable("DeviceIdentifications");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.Id)
            .HasConversion(
                id => id.Value,
                value => new DeviceIdentificationId(value))
            .ValueGeneratedNever();

        builder.Property(i => i.Status)
            .HasConversion(
                s => s.Value.ToString(),
                value => IdentificationStatus.FromName(value))
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(i => i.Gtin).HasMaxLength(32);
        builder.Property(i => i.Manufacturer).HasMaxLength(128);
        builder.Property(i => i.Model).HasMaxLength(128);
        builder.Property(i => i.FirmwareVersion).HasMaxLength(64);
        builder.Property(i => i.SerialNumber).HasMaxLength(128);
        builder.Property(i => i.DeviceType).HasMaxLength(64);
        builder.Property(i => i.IdentifiedAt).IsRequired();
    }
}