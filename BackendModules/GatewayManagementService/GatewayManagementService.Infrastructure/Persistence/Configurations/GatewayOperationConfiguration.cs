using GatewayManagementService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GatewayManagementService.Infrastructure.Persistence.Configurations;

public sealed class GatewayOperationConfiguration : IEntityTypeConfiguration<GatewayOperation>
{
    public void Configure(EntityTypeBuilder<GatewayOperation> builder)
    {
        builder.ToTable("GatewayOperations");
        builder.HasKey(o => o.Id);
        builder.Property(o => o.Id).ValueGeneratedNever();
        builder.Property(o => o.OperationType)
            .HasConversion<string>()
            .HasMaxLength(64)
            .IsRequired();
        builder.Property(o => o.Payload).HasMaxLength(4096);
        builder.Property(o => o.Result).HasMaxLength(4096);
        builder.Property(o => o.ErrorMessage).HasMaxLength(2048);
        builder.Property(o => o.StartedAt).IsRequired();
        builder.Property(o => o.Succeeded).IsRequired();
    }
}