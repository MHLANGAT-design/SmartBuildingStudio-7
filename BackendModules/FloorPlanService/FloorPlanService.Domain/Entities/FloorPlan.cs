// FloorPlanService.Domain/Entities/FloorPlan.cs

using System;
using System.Collections.Generic;

namespace FloorPlanService.Domain.Entities;

public class FloorPlan
{
    private FloorPlan() 
    {
        Floors = new List<Floor>();  // Required for EF Core
    }

    public FloorPlan(string name, string? activeProjectId = null) : this()
    {
        Id = Guid.NewGuid();
        Name = name;
        ActiveProjectId = activeProjectId;
        CreatedAt = DateTime.UtcNow;
        LastModified = DateTime.UtcNow;
        Version = 1;
        PixelsToMetresScale = 1.0;
    }

    public Guid Id { get; private set; }
    public string Name { get; set; } = string.Empty;
    public string? ActiveProjectId { get; set; }
    public string? ActiveProjectName { get; set; }
    public string? ActiveBuildingId { get; set; }
    public string? ActiveBuildingName { get; set; }
    public string? ActiveFloorId { get; set; }
    public string? ActiveFloorName { get; set; }
    public string? ActiveDocumentName { get; set; }
    
    public string DrawnWallsJson { get; set; } = "{}";
    public string DefinedRoomsJson { get; set; } = "{}";
    public string PlacedFixturesJson { get; set; } = "{}";
    public double PixelsToMetresScale { get; set; } = 1.0;
    
    public virtual ICollection<Floor> Floors { get; private set; }
    
    public DateTime CreatedAt { get; private set; }
    public DateTime LastModified { get; set; }
    public int Version { get; set; }

    public void UpdateClientName(string clientName)
    {
        Name = clientName;
        LastModified = DateTime.UtcNow;
        Version++;
    }

    public void UpdateMetadata(string? name, string? activeProjectId, string? activeProjectName)
    {
        if (!string.IsNullOrWhiteSpace(name))
            Name = name;
        
        if (!string.IsNullOrWhiteSpace(activeProjectId))
            ActiveProjectId = activeProjectId;
        
        if (!string.IsNullOrWhiteSpace(activeProjectName))
            ActiveProjectName = activeProjectName;
        
        LastModified = DateTime.UtcNow;
        Version++;
    }

    public void UpdateFloorPlanData(string drawnWallsJson, string definedRoomsJson, string placedFixturesJson, double pixelsToMetresScale)
    {
        DrawnWallsJson = drawnWallsJson;
        DefinedRoomsJson = definedRoomsJson;
        PlacedFixturesJson = placedFixturesJson;
        PixelsToMetresScale = pixelsToMetresScale;
        LastModified = DateTime.UtcNow;
        Version++;
    }
}