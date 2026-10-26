using FloorPlanService.Domain.Entities;
using FloorPlanService.Infrastructure.Configurations;
using Microsoft.EntityFrameworkCore;

namespace FloorPlanService.Infrastructure.Persistence;

public class FloorPlanDbContext : DbContext
{
    public FloorPlanDbContext(DbContextOptions<FloorPlanDbContext> options)
        : base(options)
    {
    }

    public DbSet<FloorPlan> FloorPlans { get; set; }
    public DbSet<Floor> Floors { get; set; }
    public DbSet<Wall> Walls { get; set; }
    public DbSet<Door> Doors { get; set; }
    public DbSet<Window> Windows { get; set; }
    public DbSet<Room> Rooms { get; set; }
    public DbSet<Building> Buildings { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfiguration(new FloorPlanConfiguration());
        modelBuilder.ApplyConfiguration(new FloorConfiguration());
        modelBuilder.ApplyConfiguration(new BuildingConfiguration());
        modelBuilder.ApplyConfiguration(new WallConfiguration());
        modelBuilder.ApplyConfiguration(new DoorConfiguration());
        modelBuilder.ApplyConfiguration(new WindowConfiguration());
        modelBuilder.ApplyConfiguration(new RoomConfiguration());
    }
}