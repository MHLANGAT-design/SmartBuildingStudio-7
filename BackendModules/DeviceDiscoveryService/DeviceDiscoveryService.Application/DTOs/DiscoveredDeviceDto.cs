// DTOs/DiscoveredDeviceDto.cs

namespace DeviceDiscoveryService.Application.DTOs;

public sealed class DiscoveredDeviceDto
{
    public Guid Id { get; init; }
    public string ExternalId { get; init; } = string.Empty;
    public string LineId { get; init; } = string.Empty;
    public int? ShortAddress { get; init; }
    public bool IsOnline { get; init; }

    public DateTime FirstSeenAt { get; init; }
    public DateTime LastSeenAt { get; init; }

    public DeviceIdentificationDto? Identification { get; init; }
    public DeviceMatchDto? Match { get; init; }
}