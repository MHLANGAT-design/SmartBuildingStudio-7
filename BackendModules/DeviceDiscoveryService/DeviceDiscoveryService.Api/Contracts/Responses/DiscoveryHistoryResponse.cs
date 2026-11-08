// Contracts/Responses/DiscoveryHistoryResponse.cs

using DeviceDiscoveryService.Application.DTOs;

namespace DeviceDiscoveryService.Api.Contracts.Responses;

public sealed class DiscoveryHistoryResponse
{
    public Guid Id { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string? Details { get; set; }
    public DateTime OccurredAt { get; set; }

    public static DiscoveryHistoryResponse FromDto(DiscoveryHistoryDto dto) => new()
    {
        Id = dto.Id,
        EventType = dto.EventType,
        Details = dto.Details,
        OccurredAt = dto.OccurredAt,
    };
}