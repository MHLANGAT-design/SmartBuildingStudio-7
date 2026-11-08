// Events/DiscoveryFailedEvent.cs

using DeviceDiscoveryService.Domain.ValueObjects;

namespace DeviceDiscoveryService.Domain.Events;

public sealed class DiscoveryFailedEvent : IDomainEvent
{
    public DiscoverySessionId SessionId { get; }
    public string Reason { get; }
    public DateTime FailedAt { get; }

    public DiscoveryFailedEvent(DiscoverySessionId sessionId, string reason, DateTime failedAt)
    {
        SessionId = sessionId;
        Reason = reason ?? string.Empty;
        FailedAt = failedAt;
    }
}