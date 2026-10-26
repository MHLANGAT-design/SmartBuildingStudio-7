// FloorPlanService.Domain/Entities/Wall.cs

using System;

namespace FloorPlanService.Domain.Entities;

public class Wall
{
    public Guid Id { get; set; }
    public double StartX { get; set; }
    public double StartY { get; set; }
    public double EndX { get; set; }
    public double EndY { get; set; }
    public double Thickness { get; set; } = 200;
    public double Height { get; set; } = 2800;
    public string Material { get; set; } = "Concrete";
    public string? StyleJson { get; set; }
    
    // Foreign key
    public Guid FloorId { get; set; }
    public virtual Floor Floor { get; set; } = null!;
}