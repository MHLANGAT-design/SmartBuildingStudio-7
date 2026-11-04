using System.Linq;
using CommissioningService.Application.DTOs;
using CommissioningService.Domain.Aggregates;

namespace CommissioningService.Application.Mapping;

public static class CommissioningSessionMapping
{
    public static CommissioningSessionDto ToDto(this CommissioningSession session)
    {
        if (session == null) return null!;

        return new CommissioningSessionDto
        {
            SessionId = session.Id.Value,
            ProjectId = session.ProjectId,
            FloorplanId = session.FloorplanId,
            Status = session.Status.Value.ToString().ToUpperInvariant(),
            StartedAt = session.StartedAt,
            CompletedAt = session.CompletedAt,
            StartedBy = session.StartedBy,
            Devices = session.Devices.Select(d => new DeviceStateDto
            {
                Id = d.Id.Value,
                DeviceId = d.ExternalId,
                ShortAddress = d.Address?.Value,
                ConnectionStatus = d.CommunicationStatus,
                LastResponseAt = d.LastResponseAt,
                FirmwareVersion = d.FirmwareVersion,
                IsAddressed = d.IsAddressed
            }).ToList(),
            NetworkStates = session.NetworkStates.Select(n => new NetworkStateDto
            {
                Id = n.Id,
                LineId = n.LineId,
                GatewayId = n.GatewayId,
                IsConnected = n.IsConnected,
                TotalDevices = n.TotalDevices,
                OnlineDevices = n.OnlineDevices,
                ErrorCount = n.ErrorCount,
                LastScanAt = n.LastScanAt
            }).ToList(),
            ActiveFaults = session.Defects.Select(f => new FaultDto
            {
                Id = f.Id,
                FaultId = f.FaultId,
                Category = f.Category,
                Description = f.Description,
                Severity = f.Severity,
                Status = f.Status,
                DetectedAt = f.DetectedAt
            }).ToList()
        };
    }
}