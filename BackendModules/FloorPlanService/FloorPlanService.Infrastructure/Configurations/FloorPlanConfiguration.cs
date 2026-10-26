using FloorPlanService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorPlanService.Infrastructure.Configurations;

public class FloorPlanConfiguration : IEntityTypeConfiguration<FloorPlan>
{
    public void Configure(EntityTypeBuilder<FloorPlan> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Name).IsRequired().HasMaxLength(200);
        builder.Property(e => e.DrawnWallsJson).HasColumnType("nvarchar(max)");
        builder.Property(e => e.DefinedRoomsJson).HasColumnType("nvarchar(max)");
        builder.Property(e => e.PlacedFixturesJson).HasColumnType("nvarchar(max)");
        
        builder.HasMany(e => e.Floors)
            .WithOne(e => e.FloorPlan)
            .HasForeignKey(e => e.FloorPlanId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}