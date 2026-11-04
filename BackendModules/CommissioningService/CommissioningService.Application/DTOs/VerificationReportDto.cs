using System;
using System.Collections.Generic;

namespace CommissioningService.Application.DTOs;

public class VerificationReportDto
{
    public string DeploymentId { get; set; } = string.Empty;
    public bool IsFullyVerified { get; set; }
    public DateTime VerifiedAt { get; set; }
    public VerificationSummaryDto Summary { get; set; } = new();
    public List<DeviceVerificationResultDto> Results { get; set; } = new();
}

public class VerificationSummaryDto
{
    public int MatchingDevices { get; set; }
    public int MismatchedDevices { get; set; }
    public int Passed { get; set; }
    public int Failed { get; set; }
}

public class DeviceVerificationResultDto
{
    public string DeviceId { get; set; } = string.Empty;
    public bool MatchesExpected { get; set; }
    public string? ErrorMessage { get; set; }
    public int ExpectedAddress { get; set; }
    public int ActualAddress { get; set; }
}