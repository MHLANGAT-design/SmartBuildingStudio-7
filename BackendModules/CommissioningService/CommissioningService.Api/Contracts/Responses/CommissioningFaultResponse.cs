using System;

namespace CommissioningService.Api.Contracts.Responses;

public class CommissioningFaultResponse
{
    public Guid Id { get; set; }
    public string FaultId { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}