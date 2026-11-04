using System;
using CommissioningService.Domain.Common;

namespace CommissioningService.Domain.Entities;

public class SignalLog : Entity<Guid>
{
    public string DeviceId { get; private set; } = string.Empty;
    public string SignalType { get; private set; } = string.Empty;
    public string Payload { get; private set; } = string.Empty;
    public DateTime LoggedAt { get; private set; }

    // EF Core requires a parameterless constructor
    private SignalLog() { }

    // This is the constructor your repository is trying to call
    internal SignalLog(string deviceId, string signalType, string payload)
    {
        Id = Guid.NewGuid();
        DeviceId = deviceId;
        SignalType = signalType;
        Payload = payload;
        LoggedAt = DateTime.UtcNow;
    }
}