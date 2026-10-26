// ProjectExplorerService.Domain/Aggregates/ProjectAggregate/DaliNetwork.cs
using System;

namespace ProjectExplorerService.Domain.Aggregates.ProjectAggregate;

/// <summary>
/// A DALI control network attached to a single ProjectDocument (the
/// floorplan document). One document can own many networks.
///
/// The DALI module owns the schema of <see cref="PayloadJson"/>. This
/// entity only stores it verbatim — ProjectExplorer never inspects
/// or validates the internals. See DaliDocumentSerializer on the client.
/// </summary>
public class DaliNetwork
{
    public Guid Id { get; private set; }
    public Guid DocumentId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public int Revision { get; private set; }
    public string PayloadJson { get; private set; } = "{}";
    public string CreatedAt { get; private set; } = string.Empty;
    public string UpdatedAt { get; private set; } = string.Empty;

    // EF Core
    private DaliNetwork() { }

    public DaliNetwork(
        Guid id,
        Guid documentId,
        string name,
        string payloadJson,
        string createdAt)
    {
        Id = id;
        DocumentId = documentId;
        Name = name;
        PayloadJson = payloadJson;
        Revision = 1;
        CreatedAt = createdAt;
        UpdatedAt = createdAt;
    }

    public void UpdatePayload(string name, string payloadJson, string updatedAt)
    {
        if (!string.IsNullOrWhiteSpace(name)) Name = name;
        PayloadJson = payloadJson;
        Revision += 1;
        UpdatedAt = updatedAt;
    }

    public void Rename(string name, string updatedAt)
    {
        Name = name;
        UpdatedAt = updatedAt;
    }
}