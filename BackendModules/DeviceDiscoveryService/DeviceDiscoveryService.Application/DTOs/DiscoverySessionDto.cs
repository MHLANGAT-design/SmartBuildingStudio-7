// DTOs/DiscoverySessionDto.cs

namespace DeviceDiscoveryService.Application.DTOs;

public sealed class DiscoverySessionDto
{
    public Guid Id { get; init; }
    public Guid ProjectId { get; init; }
    public Guid BuildingId { get; init; }
    public Guid FloorId { get; init; }
    public Guid DrawingDocumentId { get; init; }

    public string GatewayId { get; init; } = string.Empty;
    public List<string> LineIds { get; init; } = new();

    public string Status { get; init; } = string.Empty;
    public string? StartedBy { get; init; }

    public DateTime CreatedAt { get; init; }
    public DateTime? StartedAt { get; init; }
    public DateTime? CompletedAt { get; init; }
    public DateTime? FailedAt { get; init; }
    public string? FailureReason { get; init; }

    public int DeviceCount { get; init; }
    public int MatchedCount { get; init; }

    public List<DiscoveredDeviceDto> Devices { get; init; } = new();
}