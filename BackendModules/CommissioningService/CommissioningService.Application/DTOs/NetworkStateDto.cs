using System;

namespace CommissioningService.Application.DTOs;

public class NetworkStateDto
{
    public Guid Id { get; set; }
    public string LineId { get; set; } = string.Empty;
    public string GatewayId { get; set; } = string.Empty;
    public bool IsConnected { get; set; }
    public int TotalDevices { get; set; }
    public int OnlineDevices { get; set; }
    public int ErrorCount { get; set; }
    public DateTime LastScanAt { get; set; }
}