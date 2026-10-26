using ProjectExplorerService.Domain.ValueObjects;

namespace ProjectExplorerService.Domain.Aggregates.ProjectAggregate;

public class Project
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public string ClientName { get; private set; } = string.Empty;
    public string ProjectNumber { get; private set; } = string.Empty;
    public bool IsArchived { get; private set; }
    public string CreatedTimestamp { get; private set; } = string.Empty;
    public string LastModifiedTimestamp { get; private set; } = string.Empty;

    private readonly List<Building> _buildings = [];
    public IReadOnlyCollection<Building> Buildings => _buildings.AsReadOnly();

    private Project() { } // Required for EF Core

    public Project(Guid id, string name, string description, string clientName, string projectNumber, string createdTimestamp)
    {
        Id = id;
        Name = name;
        Description = description;
        ClientName = clientName;
        ProjectNumber = projectNumber;
        IsArchived = false;
        CreatedTimestamp = createdTimestamp;
        LastModifiedTimestamp = createdTimestamp;
    }

    public void AddBuilding(Building building, string timestamp)
    {
        _buildings.Add(building);
        UpdateModificationTimestamp(timestamp);
    }

    public void Rename(string newName, string timestamp)
    {
        if (string.IsNullOrWhiteSpace(newName))
            throw new ArgumentException("New name cannot be empty.", nameof(newName));

        Name = newName.Trim();
        UpdateModificationTimestamp(timestamp);
    }

    public void Archive(string timestamp)
    {
        IsArchived = true;
        UpdateModificationTimestamp(timestamp);
    }

    public void UpdateModificationTimestamp(string timestamp)
    {
        LastModifiedTimestamp = timestamp;
    }
}