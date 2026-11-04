using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using CommissioningService.Domain.Entities; // <-- Make sure this is here

namespace CommissioningService.Infrastructure.Persistence.Configurations;

public class CommissioningReportConfiguration : IEntityTypeConfiguration<CommissioningReport>
{
    public void Configure(EntityTypeBuilder<CommissioningReport> builder)
    {
        builder.ToTable("CommissioningReports");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.OverallStatus).HasMaxLength(50).IsRequired();
    }
}