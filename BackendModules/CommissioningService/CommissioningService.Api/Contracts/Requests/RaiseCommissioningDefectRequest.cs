using System;

namespace CommissioningService.Api.Contracts.Requests;

public class RaiseCommissioningDefectRequest
{
    public Guid SessionId { get; set; }
    public string TargetId { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Severity { get; set; } = "LOW";
}