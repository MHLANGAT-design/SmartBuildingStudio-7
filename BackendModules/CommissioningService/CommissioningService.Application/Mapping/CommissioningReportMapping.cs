using System;
using System.Linq;
using CommissioningService.Application.DTOs;
using CommissioningService.Domain.Aggregates;

namespace CommissioningService.Application.Mapping;

public static class CommissioningReportMapping
{
    public static CommissioningReportDto ToReportDto(this CommissioningSession session)
    {
        if (session == null) return null!;

        var allDefects = session.Defects.Select(d => d.ToDto()).ToList();
        var allTestResults = session.Tests.SelectMany(t => t.Results).Select(r => r.ToDto()).ToList();

        return new CommissioningReportDto
        {
            ReportId = Guid.NewGuid(), // Or generated based on session ID
            SessionId = session.Id.Value,
            GeneratedAt = DateTime.UtcNow,
            OverallStatus = session.Status.Value.ToString().ToUpperInvariant(),
            TotalDevices = session.Devices.Count,
            PassedDevices = session.Devices.Count(d => d.CommunicationStatus == "ONLINE"),
            FailedDevices = session.Devices.Count(d => d.CommunicationStatus == "FAULTY"),
            Faults = allDefects,
            TestResults = allTestResults
        };
    }
}