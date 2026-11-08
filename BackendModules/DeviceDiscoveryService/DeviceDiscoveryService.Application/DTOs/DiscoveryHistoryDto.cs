// DTOs/DiscoveryHistoryDto.cs

namespace DeviceDiscoveryService.Application.DTOs;

public sealed class DiscoveryHistoryDto
{
    public Guid Id { get; init; }
    public string EventType { get; init; } = string.Empty;
    public string? Details { get; init; }
    public DateTime OccurredAt { get; init; }
}