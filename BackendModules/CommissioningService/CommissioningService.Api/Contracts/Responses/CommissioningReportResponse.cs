using System;
using System.Collections.Generic;

namespace CommissioningService.Api.Contracts.Responses;

public class CommissioningReportResponse
{
    public Guid ReportId { get; set; }
    public Guid SessionId { get; set; }
    public DateTime GeneratedAt { get; set; }
    public string OverallStatus { get; set; } = string.Empty;
    public int TotalDevices { get; set; }
    public int PassedDevices { get; set; }
    public int FailedDevices { get; set; }
    
    public List<CommissioningFaultResponse> Faults { get; set; } = new();
    public List<CommissioningTestResultResponse> TestResults { get; set; } = new();
}