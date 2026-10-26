// FloorPlanService.Domain/Entities/Building.cs

using System;

namespace FloorPlanService.Domain.Entities;

public class Building
{
    private Building() { }

    public Building(string name, string? projectId = null)
    {
        Id = Guid.NewGuid();
        Name = name;
        ProjectId = projectId;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
        Version = 1;
    }

    public Guid Id { get; private set; }
    public string Name { get; set; } = string.Empty;
    public string? ProjectId { get; set; }
    public string? ProjectName { get; set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; set; }
    public int Version { get; set; }

    public void UpdateName(string name)
    {
        Name = name;
        UpdatedAt = DateTime.UtcNow;
        Version++;
    }
}