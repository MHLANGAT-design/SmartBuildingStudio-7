// Entities/DiscoveredDevice.cs

namespace DeviceDiscoveryService.Domain.Entities;

public sealed class DiscoveredDevice
{
    public DiscoveredDeviceId Id { get; private set; }

    /// <summary>The stable id returned by the gateway scan (e.g. "dev-fx-abc123").</summary>
    public string ExternalId { get; private set; } = string.Empty;

    /// <summary>DALI address (line + short address).</summary>
    public PhysicalDeviceAddress Address { get; private set; } = null!;

    public DeviceIdentification? Identification { get; private set; }
    public DeviceMatch? Match { get; private set; }

    public bool IsOnline { get; private set; }
    public DateTime FirstSeenAt { get; private set; }
    public DateTime LastSeenAt { get; private set; }

    private DiscoveredDevice(
        DiscoveredDeviceId id,
        string externalId,
        PhysicalDeviceAddress address,
        bool isOnline,
        DateTime firstSeenAt)
    {
        Id = id;
        ExternalId = externalId;
        Address = address;
        IsOnline = isOnline;
        FirstSeenAt = firstSeenAt;
        LastSeenAt = firstSeenAt;
    }

    public static DiscoveredDevice Create(
        string externalId,
        PhysicalDeviceAddress address,
        DateTime discoveredAt,
        bool isOnline = true)
    {
        if (string.IsNullOrWhiteSpace(externalId))
            throw new ArgumentException("ExternalId is required.", nameof(externalId));
        if (address is null) throw new ArgumentNullException(nameof(address));

        return new DiscoveredDevice(DiscoveredDeviceId.New(), externalId.Trim(), address, isOnline, discoveredAt);
    }

    public void MarkSeen(DateTime seenAt, bool isOnline)
    {
        LastSeenAt = seenAt;
        IsOnline = isOnline;
    }

    public void AttachIdentification(DeviceIdentification identification)
    {
        Identification = identification ?? throw new ArgumentNullException(nameof(identification));
    }

    public void AttachMatch(DeviceMatch match)
    {
        Match = match ?? throw new ArgumentNullException(nameof(match));
    }

    // EF Core
    private DiscoveredDevice() { }
}