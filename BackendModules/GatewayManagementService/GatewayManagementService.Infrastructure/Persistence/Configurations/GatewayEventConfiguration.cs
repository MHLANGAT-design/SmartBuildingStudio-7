using GatewayManagementService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GatewayManagementService.Infrastructure.Persistence.Configurations;

public sealed class GatewayEventConfiguration : IEntityTypeConfiguration<GatewayEvent>
{
    public void Configure(EntityTypeBuilder<GatewayEvent> builder)
    {
        builder.ToTable("GatewayEvents");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedNever();
        builder.Property(e => e.EventType)
            .HasConversion<string>()
            .HasMaxLength(64)
            .IsRequired();
        builder.Property(e => e.Message).HasMaxLength(2048);
        builder.Property(e => e.Payload).HasMaxLength(4096);
        builder.Property(e => e.OccurredAt).IsRequired();
    }
}