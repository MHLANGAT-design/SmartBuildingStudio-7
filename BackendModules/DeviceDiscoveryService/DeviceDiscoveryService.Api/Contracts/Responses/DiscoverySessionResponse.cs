// Contracts/Responses/DiscoverySessionResponse.cs

using DeviceDiscoveryService.Application.DTOs;

namespace DeviceDiscoveryService.Api.Contracts.Responses;

public sealed class DiscoverySessionResponse
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid BuildingId { get; set; }
    public Guid FloorId { get; set; }
    public Guid DrawingDocumentId { get; set; }

    public string GatewayId { get; set; } = string.Empty;
    public List<string> LineIds { get; set; } = new();

    public string Status { get; set; } = string.Empty;
    public string? StartedBy { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? FailedAt { get; set; }
    public string? FailureReason { get; set; }

    public int DeviceCount { get; set; }
    public int MatchedCount { get; set; }

    public List<DiscoveredDeviceResponse> Devices { get; set; } = new();

    public static DiscoverySessionResponse FromDto(DiscoverySessionDto dto) => new()
    {
        Id = dto.Id,
        ProjectId = dto.ProjectId,
        BuildingId = dto.BuildingId,
        FloorId = dto.FloorId,
        DrawingDocumentId = dto.DrawingDocumentId,
        GatewayId = dto.GatewayId,
        LineIds = dto.LineIds,
        Status = dto.Status,
        StartedBy = dto.StartedBy,
        CreatedAt = dto.CreatedAt,
        StartedAt = dto.StartedAt,
        CompletedAt = dto.CompletedAt,
        FailedAt = dto.FailedAt,
        FailureReason = dto.FailureReason,
        DeviceCount = dto.DeviceCount,
        MatchedCount = dto.MatchedCount,
        Devices = dto.Devices.Select(DiscoveredDeviceResponse.FromDto).ToList(),
    };
}