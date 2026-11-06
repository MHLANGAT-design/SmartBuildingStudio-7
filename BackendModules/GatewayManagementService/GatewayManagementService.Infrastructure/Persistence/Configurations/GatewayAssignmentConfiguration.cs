// GatewayManagementService.Infrastructure/Persistence/Configurations/GatewayAssignmentConfiguration.cs

using GatewayManagementService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GatewayManagementService.Infrastructure.Persistence.Configurations;

public sealed class GatewayAssignmentConfiguration : IEntityTypeConfiguration<GatewayAssignment>
{
    public void Configure(EntityTypeBuilder<GatewayAssignment> builder)
    {
        builder.ToTable("GatewayAssignments");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).ValueGeneratedNever();
        builder.Property(a => a.ProjectId).IsRequired();
        builder.Property(a => a.AssignedAt).IsRequired();
        builder.HasIndex(a => a.ProjectId);
    }
}