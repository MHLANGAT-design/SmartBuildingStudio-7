// Mapping/DiscoverySessionMappingProfile.cs

using DeviceDiscoveryService.Application.DTOs;
using DeviceDiscoveryService.Domain.Aggregates;

namespace DeviceDiscoveryService.Application.Mapping;

public static class DiscoverySessionMappingProfile
{
    public static DiscoverySessionDto ToDto(this DiscoverySession session)
    {
        if (session is null) throw new ArgumentNullException(nameof(session));

        return new DiscoverySessionDto
        {
            Id = session.Id.Value,
            ProjectId = session.ProjectId,
            BuildingId = session.BuildingId,
            FloorId = session.FloorId,
            DrawingDocumentId = session.DrawingDocumentId,
            GatewayId = session.Scope.GatewayId,
            LineIds = session.Scope.LineIds.ToList(),
            Status = session.Status.Value.ToString(),
            StartedBy = session.StartedBy,
            CreatedAt = session.CreatedAt,
            StartedAt = session.StartedAt,
            CompletedAt = session.CompletedAt,
            FailedAt = session.FailedAt,
            FailureReason = session.FailureReason,
            DeviceCount = session.DeviceCount,
            MatchedCount = session.MatchedCount,
            Devices = session.Devices.Select(d => d.ToDto()).ToList(),
        };
    }
}