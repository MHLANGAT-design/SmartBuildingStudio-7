using System;

namespace CommissioningService.Application.DTOs;

public class TestResultDto
{
    public Guid Id { get; set; }
    public Guid TestId { get; set; }
    public string DeviceId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? ExpectedValue { get; set; }
    public string? ActualValue { get; set; }
    public long DurationMs { get; set; }
    public DateTime ExecutedAt { get; set; }
}