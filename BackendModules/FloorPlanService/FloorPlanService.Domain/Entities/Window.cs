// FloorPlanService.Domain/Entities/Window.cs

using System;

namespace FloorPlanService.Domain.Entities;

public class Window
{
    public Guid Id { get; set; }
    public string WallId { get; set; } = string.Empty;
    public double X { get; set; }
    public double Y { get; set; }
    public double Width { get; set; } = 1200;
    public double Height { get; set; } = 1500;
    public double Transmittance { get; set; } = 0.75;
    public string? StyleJson { get; set; }
    
    // Foreign key
    public Guid FloorId { get; set; }
    public virtual Floor Floor { get; set; } = null!;
}