using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using CommissioningService.Domain.Entities;

namespace CommissioningService.Infrastructure.Persistence.Configurations;

public class SignalLogConfiguration : IEntityTypeConfiguration<SignalLog>
{
    public void Configure(EntityTypeBuilder<SignalLog> builder)
    {
        builder.ToTable("SignalLogs");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.DeviceId).IsRequired();
        builder.Property(x => x.Payload).IsRequired();
    }
}