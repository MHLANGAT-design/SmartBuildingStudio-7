using FloorPlanService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorPlanService.Infrastructure.Configurations;

public class FloorConfiguration : IEntityTypeConfiguration<Floor>
{
    public void Configure(EntityTypeBuilder<Floor> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Name).IsRequired().HasMaxLength(200);
        builder.Property(e => e.LevelIndex).IsRequired();
        builder.Property(e => e.ElevationHeightMeters).HasDefaultValue(3.0);
        
        builder.HasMany(e => e.Walls)
            .WithOne(e => e.Floor)
            .HasForeignKey(e => e.FloorId)
            .OnDelete(DeleteBehavior.Cascade);
            
        builder.HasMany(e => e.Doors)
            .WithOne(e => e.Floor)
            .HasForeignKey(e => e.FloorId)
            .OnDelete(DeleteBehavior.Cascade);
            
        builder.HasMany(e => e.Windows)
            .WithOne(e => e.Floor)
            .HasForeignKey(e => e.FloorId)
            .OnDelete(DeleteBehavior.Cascade);
            
        builder.HasMany(e => e.Rooms)
            .WithOne(e => e.Floor)
            .HasForeignKey(e => e.FloorId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}