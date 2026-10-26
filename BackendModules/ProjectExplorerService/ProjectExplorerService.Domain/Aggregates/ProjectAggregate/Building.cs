namespace ProjectExplorerService.Domain.Aggregates.ProjectAggregate;

public class Building
{
    public Guid Id { get; private set; }
    public Guid ProjectId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Code { get; private set; } = string.Empty;
    public string? Address { get; private set; }
    public string LastModifiedTimestamp { get; private set; } = string.Empty;

    private readonly List<Floor> _floors = [];
    public IReadOnlyCollection<Floor> Floors => _floors.AsReadOnly();

    private Building() { } // Required for EF Core

    public Building(Guid id, Guid projectId, string name, string code, string? address, string timestamp)
    {
        Id = id;
        ProjectId = projectId;
        Name = name;
        Code = code;
        Address = address;
        LastModifiedTimestamp = timestamp;
    }

    public void AddFloor(Floor floor, string timestamp)
    {
        _floors.Add(floor);
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