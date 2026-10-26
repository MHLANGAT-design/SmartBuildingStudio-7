// FloorPlanService.Domain/Entities/Door.cs

using System;

namespace FloorPlanService.Domain.Entities;

public class Door
{
    public Guid Id { get; set; }
    public string WallId { get; set; } = string.Empty;
    public double X { get; set; }
    public double Y { get; set; }
    public double Width { get; set; } = 900;
    public double Height { get; set; } = 2100;
    public string DoorType { get; set; } = "Single Swing";
    public string Swing { get; set; } = "Inward";
    public string? StyleJson { get; set; }
    
    // Foreign key
    public Guid FloorId { get; set; }
    public virtual Floor Floor { get; set; } = null!;
}