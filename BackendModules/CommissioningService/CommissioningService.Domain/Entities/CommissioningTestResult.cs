using System;
using CommissioningService.Domain.Common;
using CommissioningService.Domain.ValueObjects;

namespace CommissioningService.Domain.Entities;

public class CommissioningTestResult : Entity<Guid>
{
    // FIX: Changed from Guid to CommissioningTestId
    public CommissioningTestId TestId { get; private set; } = default!;
    public string DeviceId { get; private set; } = string.Empty;
    public string Status { get; private set; } = string.Empty;
    public string? ExpectedValue { get; private set; }
    public string? ActualValue { get; private set; }
    public DateTime ExecutedAt { get; private set; }
    public long DurationMs { get; private set; }

    // EF Core constructor
    private CommissioningTestResult() { }

    internal CommissioningTestResult(CommissioningTestId testId, string deviceId, string status, string? expected, string? actual, long durationMs)
    {
        Id = Guid.NewGuid();
        TestId = testId;
        DeviceId = deviceId;
        Status = status;
        ExpectedValue = expected;
        ActualValue = actual;
        DurationMs = durationMs;
        ExecutedAt = DateTime.UtcNow;
    }
}