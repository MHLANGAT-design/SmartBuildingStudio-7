using System;
using CommissioningService.Domain.Common;

namespace CommissioningService.Domain.Events;

public sealed class NetworkTestCompletedEvent : DomainEvent
{
    public Guid SessionId { get; }
    public int TotalDevices { get; }
    public int OnlineDevices { get; }
    public int ErrorCount { get; }

    public NetworkTestCompletedEvent(Guid sessionId, int totalDevices, int onlineDevices, int errorCount)
    {
        SessionId = sessionId;
        TotalDevices = totalDevices;
        OnlineDevices = onlineDevices;
        ErrorCount = errorCount;
    }
}