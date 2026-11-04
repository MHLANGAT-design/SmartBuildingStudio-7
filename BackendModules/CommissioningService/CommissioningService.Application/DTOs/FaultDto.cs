using System;

namespace CommissioningService.Application.DTOs;

public class FaultDto
{
    public Guid Id { get; set; }
    public string FaultId { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Severity { get; set; } = "LOW";
    public string Status { get; set; } = "OPEN";
    public DateTime DetectedAt { get; set; }
}