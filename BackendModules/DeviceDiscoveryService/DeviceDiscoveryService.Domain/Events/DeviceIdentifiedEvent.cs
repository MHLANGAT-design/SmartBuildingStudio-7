// Events/DeviceIdentifiedEvent.cs

using DeviceDiscoveryService.Domain.ValueObjects;

namespace DeviceDiscoveryService.Domain.Events;

public sealed class DeviceIdentifiedEvent : IDomainEvent
{
    public DiscoverySessionId SessionId { get; }
    public DiscoveredDeviceId DeviceId { get; }
    public string ExternalId { get; }
    public IdentificationStatus Status { get; }
    public DateTime IdentifiedAt { get; }

    public DeviceIdentifiedEvent(
        DiscoverySessionId sessionId,
        DiscoveredDeviceId deviceId,
        string externalId,
        IdentificationStatus status,
        DateTime identifiedAt)
    {
        SessionId = sessionId;
        DeviceId = deviceId;
        ExternalId = externalId ?? string.Empty;
        Status = status;
        IdentifiedAt = identifiedAt;
    }
}