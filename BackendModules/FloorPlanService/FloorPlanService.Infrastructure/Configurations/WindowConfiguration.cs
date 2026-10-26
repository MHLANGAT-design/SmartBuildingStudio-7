using FloorPlanService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorPlanService.Infrastructure.Configurations;

public class WindowConfiguration : IEntityTypeConfiguration<Window>
{
    public void Configure(EntityTypeBuilder<Window> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.WallId).IsRequired().HasMaxLength(50);
        builder.Property(e => e.StyleJson).HasColumnType("nvarchar(max)");
    }
}