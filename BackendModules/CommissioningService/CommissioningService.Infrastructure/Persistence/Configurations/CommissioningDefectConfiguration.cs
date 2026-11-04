using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using CommissioningService.Domain.Entities;

namespace CommissioningService.Infrastructure.Persistence.Configurations;

public class CommissioningDefectConfiguration : IEntityTypeConfiguration<CommissioningDefect>
{
    public void Configure(EntityTypeBuilder<CommissioningDefect> builder)
    {
        builder.ToTable("CommissioningDefects");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Category).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Severity).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(50).IsRequired();
    }
}