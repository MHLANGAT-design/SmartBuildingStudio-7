using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using CommissioningService.Domain.Entities;
using CommissioningService.Domain.ValueObjects;

namespace CommissioningService.Infrastructure.Persistence.Configurations;

public class CommissioningDeviceConfiguration : IEntityTypeConfiguration<CommissioningDevice>
{
    public void Configure(EntityTypeBuilder<CommissioningDevice> builder)
    {
        builder.ToTable("CommissioningDevices");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .HasConversion(
                v => v.Value,
                v => new CommissioningDeviceId(v));

        builder.Property(x => x.Address)
            .HasConversion(
                v => v == null ? (int?)null : v.Value,
                v => v == null ? null : new DeviceAddress(v.Value));
    }
}