// FloorPlanService.Domain/Entities/Room.cs

using System;

namespace FloorPlanService.Domain.Entities;

public class Room
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string VerticesJson { get; set; } = "[]";
    public int TargetLux { get; set; } = 500;
    public string SpaceType { get; set; } = "Office";
    public double Area { get; set; }
    public string? StyleJson { get; set; }
    
    // Foreign key
    public Guid FloorId { get; set; }
    public virtual Floor Floor { get; set; } = null!;
}