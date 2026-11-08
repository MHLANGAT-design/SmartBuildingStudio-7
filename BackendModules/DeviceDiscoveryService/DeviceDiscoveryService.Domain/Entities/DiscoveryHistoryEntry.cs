// Entities/DiscoveryHistoryEntry.cs

namespace DeviceDiscoveryService.Domain.Entities;

/// <summary>
/// An immutable audit row — one entry per state change or notable event
/// that happened during the session's lifetime.
/// </summary>
public sealed class DiscoveryHistoryEntry
{
    public Guid Id { get; private set; }
    public string EventType { get; private set; } = string.Empty;
    public string? Details { get; private set; }
    public DateTime OccurredAt { get; private set; }

    private DiscoveryHistoryEntry(Guid id, string eventType, string? details, DateTime occurredAt)
    {
        Id = id;
        EventType = eventType;
        Details = details;
        OccurredAt = occurredAt;
    }

    public static DiscoveryHistoryEntry Create(string eventType, DateTime occurredAt, string? details = null)
    {
        if (string.IsNullOrWhiteSpace(eventType))
            throw new ArgumentException("EventType is required.", nameof(eventType));

        return new DiscoveryHistoryEntry(Guid.NewGuid(), eventType.Trim(), details, occurredAt);
    }

    // EF Core
    private DiscoveryHistoryEntry() { }
}