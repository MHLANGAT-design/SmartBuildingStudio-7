using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using CommissioningService.Domain.Entities;

namespace CommissioningService.Infrastructure.Persistence.Configurations;

public class AddressAssignmentConfiguration : IEntityTypeConfiguration<AddressAssignment>
{
    public void Configure(EntityTypeBuilder<AddressAssignment> builder)
    {
        builder.ToTable("AddressAssignments");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.DeviceId).IsRequired();
        builder.Property(x => x.LineId).IsRequired();
    }
}