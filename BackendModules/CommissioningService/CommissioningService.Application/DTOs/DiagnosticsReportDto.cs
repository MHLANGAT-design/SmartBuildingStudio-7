using System;
using System.Collections.Generic;

namespace CommissioningService.Application.DTOs;

public class DiagnosticsReportDto
{
    public string GatewayId { get; set; } = string.Empty;
    public string LineId { get; set; } = string.Empty;
    public DateTime ExecutedAt { get; set; }
    public bool IsHealthy { get; set; }
    public BusStatisticsDto BusStats { get; set; } = new();
    public DiagnosticsSummaryDto Summary { get; set; } = new();
    public List<DeviceDiagnosticsDto> DeviceStatuses { get; set; } = new();
    public List<string> GlobalIssues { get; set; } = new();
}

public class BusStatisticsDto
{
    public int Successful { get; set; }
    public int Failed { get; set; }
    public int Timeouts { get; set; }
    public double SuccessRatePercent { get; set; }
}

public class DiagnosticsSummaryDto
{
    public int TotalIssues { get; set; }
}

public class DeviceDiagnosticsDto
{
    public string DeviceId { get; set; } = string.Empty;
    public bool IsOnline { get; set; }
    public int? ShortAddress { get; set; }
    public int? ErrorCode { get; set; }
    public string Status { get; set; } = "OK";
}