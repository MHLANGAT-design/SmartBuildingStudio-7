using System;

namespace CommissioningService.Api.Contracts.Requests;

public class ResolveCommissioningDefectRequest
{
    public Guid SessionId { get; set; }
    public Guid DefectId { get; set; }
    public string ResolvedBy { get; set; } = string.Empty;
}