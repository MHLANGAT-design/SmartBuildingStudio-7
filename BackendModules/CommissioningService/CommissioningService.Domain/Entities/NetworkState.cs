using System;
using CommissioningService.Domain.Common;

namespace CommissioningService.Domain.Entities;

public class NetworkState : Entity<Guid>
{
    public string LineId { get; private set; }
    public string GatewayId { get; private set; }
    public bool IsConnected { get; private set; }
    public int TotalDevices { get; private set; }
    public int OnlineDevices { get; private set; }
    public int ErrorCount { get; private set; }
    public DateTime LastScanAt { get; private set; }

    // EF Core constructor
    private NetworkState() { }

    internal NetworkState(string lineId, string gatewayId)
    {
        Id = Guid.NewGuid();
        LineId = lineId;
        GatewayId = gatewayId;
        IsConnected = true;
        LastScanAt = DateTime.UtcNow;
    }

    internal void UpdateState(int total, int online, int errors)
    {
        TotalDevices = total;
        OnlineDevices = online;
        ErrorCount = errors;
        IsConnected = true; // Assuming if we get a state update, it's connected
        LastScanAt = DateTime.UtcNow;
    }
}