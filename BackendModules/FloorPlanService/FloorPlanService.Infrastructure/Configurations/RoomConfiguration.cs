using FloorPlanService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorPlanService.Infrastructure.Configurations;

public class RoomConfiguration : IEntityTypeConfiguration<Room>
{
    public void Configure(EntityTypeBuilder<Room> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Name).IsRequired().HasMaxLength(200);
        builder.Property(e => e.VerticesJson).HasColumnType("nvarchar(max)");
        builder.Property(e => e.SpaceType).HasMaxLength(50);
        builder.Property(e => e.StyleJson).HasColumnType("nvarchar(max)");
    }
}