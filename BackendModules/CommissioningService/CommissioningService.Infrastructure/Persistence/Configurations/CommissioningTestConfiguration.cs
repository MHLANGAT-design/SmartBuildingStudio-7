using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using CommissioningService.Domain.Entities;
using CommissioningService.Domain.ValueObjects;

namespace CommissioningService.Infrastructure.Persistence.Configurations;

public class CommissioningTestConfiguration : IEntityTypeConfiguration<CommissioningTest>
{
    public void Configure(EntityTypeBuilder<CommissioningTest> builder)
    {
        builder.ToTable("CommissioningTests");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasConversion(
            v => v.Value,
            v => new CommissioningTestId(v));
            
        builder.HasMany(x => x.Results).WithOne().HasForeignKey("TestId");
    }
}