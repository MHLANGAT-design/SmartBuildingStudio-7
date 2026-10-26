// FloorPlanService.Domain/Entities/Floor.cs

using System;
using System.Collections.Generic;

namespace FloorPlanService.Domain.Entities;

public class Floor
{
    private Floor() 
    {
        Walls = new List<Wall>();
        Doors = new List<Door>();
        Windows = new List<Window>();
        Rooms = new List<Room>();
    }

    public Floor(string name, int levelIndex, double elevationHeightMeters = 3.0) : this()
    {
        Id = Guid.NewGuid();
        Name = name;
        LevelIndex = levelIndex;
        ElevationHeightMeters = elevationHeightMeters;
    }

    public Guid Id { get; private set; }
    public string Name { get; set; } = string.Empty;
    public int LevelIndex { get; set; }
    public double ElevationHeightMeters { get; set; }
    
    public Guid FloorPlanId { get; set; }
    public virtual FloorPlan FloorPlan { get; set; } = null!;
    
    public virtual ICollection<Wall> Walls { get; private set; }
    public virtual ICollection<Door> Doors { get; private set; }
    public virtual ICollection<Window> Windows { get; private set; }
    public virtual ICollection<Room> Rooms { get; private set; }

    public void UpdateMetadata(string? name, int? levelIndex)
    {
        if (!string.IsNullOrWhiteSpace(name))
            Name = name;
        
        if (levelIndex.HasValue)
            LevelIndex = levelIndex.Value;
    }

    public void AddWall(Wall wall) => Walls.Add(wall);
    public void AddDoor(Door door) => Doors.Add(door);
    public void AddWindow(Window window) => Windows.Add(window);
    public void AddRoom(Room room) => Rooms.Add(room);
}