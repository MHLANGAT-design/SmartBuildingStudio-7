using FloorPlanService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorPlanService.Infrastructure.Configurations;

public class DoorConfiguration : IEntityTypeConfiguration<Door>
{
    public void Configure(EntityTypeBuilder<Door> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.WallId).IsRequired().HasMaxLength(50);
        builder.Property(e => e.DoorType).HasMaxLength(50);
        builder.Property(e => e.Swing).HasMaxLength(20);
        builder.Property(e => e.StyleJson).HasColumnType("nvarchar(max)");
    }
}