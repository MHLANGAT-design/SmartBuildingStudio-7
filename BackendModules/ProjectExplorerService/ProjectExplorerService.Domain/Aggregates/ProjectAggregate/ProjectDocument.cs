namespace ProjectExplorerService.Domain.Aggregates.ProjectAggregate;

public class ProjectDocument
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public int DocumentType { get; private set; }
    public string RoutePath { get; private set; } = string.Empty;
    public int Version { get; private set; }
    public string LastModifiedBy { get; private set; } = string.Empty;
    public string LastModifiedTimestamp { get; private set; } = string.Empty;
    public long FileSizeInBytes { get; private set; }
    public bool IsLocked { get; private set; }
    public string? LockedByUsername { get; private set; }

    // ✅ NEW PROPERTIES FOR FLOOR PLAN DATA
    public string DrawnWallsJson { get; private set; } = "{}";
    public string DefinedRoomsJson { get; private set; } = "[]";
    public string PlacedFixturesJson { get; private set; } = "{\"importedDrawings\":[],\"electricalFixtures\":[]}";
    public double PixelsToMetresScale { get; private set; } = 1.0;

    private ProjectDocument() { } // Required for EF Core

    public ProjectDocument(
        Guid id, 
        string name, 
        int documentType, 
        string routePath, 
        int version, 
        string lastModifiedBy, 
        string timestamp, 
        long fileSizeInBytes)
    {
        Id = id;
        Name = name;
        DocumentType = documentType;
        RoutePath = routePath;
        Version = version;
        LastModifiedBy = lastModifiedBy;
        LastModifiedTimestamp = timestamp;
        FileSizeInBytes = fileSizeInBytes;
        IsLocked = false;
        LockedByUsername = null;
    }

    public void Lock(string username, string timestamp)
    {
        IsLocked = true;
        LockedByUsername = username;
        UpdateModification(username, timestamp);
    }

    public void Unlock(string username, string timestamp)
    {
        IsLocked = false;
        LockedByUsername = null;
        UpdateModification(username, timestamp);
    }

    public void UpdateModification(string username, string timestamp)
    {
        Version++;
        LastModifiedBy = username;
        LastModifiedTimestamp = timestamp;
    }

    // ✅ NEW: Update the document name
    public void UpdateName(string newName, string modifiedBy, string timestamp)
    {
        if (string.IsNullOrWhiteSpace(newName))
            throw new ArgumentException("Name cannot be empty.", nameof(newName));
        
        Name = newName;
        UpdateModification(modifiedBy, timestamp);
    }

    // ✅ NEW: Update floor plan data (including name if provided)
    public void UpdateFloorPlanData(
        string drawnWallsJson, 
        string definedRoomsJson, 
        string placedFixturesJson, 
        double pixelsToMetresScale,
        string modifiedBy,
        string timestamp,
        string? newName = null)  // optional name update
    {
        DrawnWallsJson = drawnWallsJson;
        DefinedRoomsJson = definedRoomsJson;
        PlacedFixturesJson = placedFixturesJson;
        PixelsToMetresScale = pixelsToMetresScale;
        
        if (!string.IsNullOrWhiteSpace(newName))
        {
            Name = newName;
        }
        
        UpdateModification(modifiedBy, timestamp);
    }
}