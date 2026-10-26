using FloorPlanService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorPlanService.Infrastructure.Configurations;

public class WallConfiguration : IEntityTypeConfiguration<Wall>
{
    public void Configure(EntityTypeBuilder<Wall> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Material).HasMaxLength(100);
        builder.Property(e => e.StyleJson).HasColumnType("nvarchar(max)");
    }
}