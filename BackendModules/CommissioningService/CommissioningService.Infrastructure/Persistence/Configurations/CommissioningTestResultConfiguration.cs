using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using CommissioningService.Domain.Entities;
using CommissioningService.Domain.ValueObjects;

namespace CommissioningService.Infrastructure.Persistence.Configurations;

public class CommissioningTestResultConfiguration : IEntityTypeConfiguration<CommissioningTestResult>
{
    public void Configure(EntityTypeBuilder<CommissioningTestResult> builder)
    {
        builder.ToTable("CommissioningTestResults");
        builder.HasKey(x => x.Id);
        
        // FIX: Map the Value Object to a Guid column
        builder.Property(x => x.TestId)
            .HasConversion(
                v => v.Value,
                v => new CommissioningTestId(v));
            
        builder.Property(x => x.DeviceId).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(50);
    }
}