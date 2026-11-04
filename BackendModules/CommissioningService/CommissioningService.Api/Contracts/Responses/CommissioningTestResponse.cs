using System;

namespace CommissioningService.Api.Contracts.Responses;

public class CommissioningTestResponse
{
    public Guid TestId { get; set; }
    public string TestType { get; set; } = string.Empty;
    public string TargetId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}