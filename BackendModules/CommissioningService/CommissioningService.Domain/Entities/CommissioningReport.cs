using System;
using CommissioningService.Domain.Common;

namespace CommissioningService.Domain.Entities;

public class CommissioningReport : Entity<Guid>
{
    public Guid SessionId { get; private set; }
    public DateTime GeneratedAt { get; private set; }
    public string OverallStatus { get; private set; } = string.Empty;
    public int TotalDevices { get; private set; }
    public int PassedDevices { get; private set; }
    public int FailedDevices { get; private set; }

    private CommissioningReport() { }

    internal CommissioningReport(Guid sessionId, string status, int total, int passed, int failed)
    {
        Id = Guid.NewGuid();
        SessionId = sessionId;
        GeneratedAt = DateTime.UtcNow;
        OverallStatus = status;
        TotalDevices = total;
        PassedDevices = passed;
        FailedDevices = failed;
    }
}