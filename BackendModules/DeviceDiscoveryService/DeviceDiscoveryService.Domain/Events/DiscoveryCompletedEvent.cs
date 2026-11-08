// Events/DiscoveryCompletedEvent.cs

using DeviceDiscoveryService.Domain.ValueObjects;

namespace DeviceDiscoveryService.Domain.Events;

public sealed class DiscoveryCompletedEvent : IDomainEvent
{
    public DiscoverySessionId SessionId { get; }
    public int DeviceCount { get; }
    public int MatchedCount { get; }
    public DateTime CompletedAt { get; }

    public DiscoveryCompletedEvent(
        DiscoverySessionId sessionId,
        int deviceCount,
        int matchedCount,
        DateTime completedAt)
    {
        SessionId = sessionId;
        DeviceCount = deviceCount;
        MatchedCount = matchedCount;
        CompletedAt = completedAt;
    }
}