using System;
using System.Collections.Generic;

namespace CommissioningService.Application.DTOs;

public class CommissioningReportDto
{
    public Guid ReportId { get; set; }
    public Guid SessionId { get; set; }
    public DateTime GeneratedAt { get; set; }
    public string OverallStatus { get; set; } = string.Empty;
    public int TotalDevices { get; set; }
    public int PassedDevices { get; set; }
    public int FailedDevices { get; set; }
    
    public List<FaultDto> Faults { get; set; } = new();
    public List<TestResultDto> TestResults { get; set; } = new();
}