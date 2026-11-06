// GatewayManagementService.Infrastructure/Persistence/Configurations/GatewayConnectionRecordConfiguration.cs

using GatewayManagementService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GatewayManagementService.Infrastructure.Persistence.Configurations;

public sealed class GatewayConnectionRecordConfiguration : IEntityTypeConfiguration<GatewayConnectionRecord>
{
    public void Configure(EntityTypeBuilder<GatewayConnectionRecord> builder)
    {
        builder.ToTable("GatewayConnectionRecords");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).ValueGeneratedNever();
        builder.Property(r => r.ConnectedAt).IsRequired();
        builder.Property(r => r.DisconnectReason).HasMaxLength(512);
        builder.Property(r => r.RemoteEndpoint).HasMaxLength(512);
    }
}