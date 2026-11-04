using System;

namespace CommissioningService.Application.DTOs;

public class CommissioningDeviceDto
{
    public Guid Id { get; set; }
    public string ExternalId { get; set; } = string.Empty;
    public int? ShortAddress { get; set; }
    public string CommunicationStatus { get; set; } = "UNKNOWN";
    public DateTime? LastResponseAt { get; set; }
    public string? FirmwareVersion { get; set; }
    public int? ErrorCode { get; set; }
    public bool IsAddressed { get; set; }
}