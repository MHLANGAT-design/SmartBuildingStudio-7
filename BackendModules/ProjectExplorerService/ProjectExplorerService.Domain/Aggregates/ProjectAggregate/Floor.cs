namespace ProjectExplorerService.Domain.Aggregates.ProjectAggregate;

public class Floor
{
    public Guid Id { get; private set; }
    public Guid BuildingId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public int LevelNumber { get; private set; }
    public double ElevationMeters { get; private set; }
    public double FloorAreaSqMeters { get; private set; }
    public string LastModifiedTimestamp { get; private set; } = string.Empty;

    private readonly List<ProjectDocument> _documents = [];
    public IReadOnlyCollection<ProjectDocument> Documents => _documents.AsReadOnly();

    private Floor() { } // Required for EF Core

    public Floor(Guid id, Guid buildingId, string name, int levelNumber, double elevationMeters, double floorAreaSqMeters, string timestamp)
    {
        Id = id;
        BuildingId = buildingId;
        Name = name;
        LevelNumber = levelNumber;
        ElevationMeters = elevationMeters;
        FloorAreaSqMeters = floorAreaSqMeters;
        LastModifiedTimestamp = timestamp;
    }

    public void AddDocument(ProjectDocument document, string timestamp)
    {
        _documents.Add(document);
        UpdateModificationTimestamp(timestamp);
    }

    public void Rename(string newName, string timestamp)
    {
        if (string.IsNullOrWhiteSpace(newName))
            throw new ArgumentException("New name cannot be empty.", nameof(newName));

        Name = newName.Trim();
        UpdateModificationTimestamp(timestamp);
    }

    public void UpdateModificationTimestamp(string timestamp)
    {
        LastModifiedTimestamp = timestamp;
    }
}