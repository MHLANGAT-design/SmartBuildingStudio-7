using System;

namespace CommissioningService.Application.DTOs;

public class DeviceStateDto
{
    public Guid Id { get; set; }
    public string DeviceId { get; set; } = string.Empty;
    public int? ShortAddress { get; set; }
    public string ConnectionStatus { get; set; } = "UNKNOWN";
    public DateTime? LastResponseAt { get; set; }
    public string? FirmwareVersion { get; set; }
    public bool IsAddressed { get; set; }
}