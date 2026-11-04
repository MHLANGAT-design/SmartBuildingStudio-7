using System;
using CommissioningService.Domain.Common;

namespace CommissioningService.Domain.Events;

public sealed class DeviceAddressVerifiedEvent : DomainEvent
{
    public Guid SessionId { get; }
    public Guid DeviceId { get; }
    public int Address { get; }

    public DeviceAddressVerifiedEvent(Guid sessionId, Guid deviceId, int address)
    {
        SessionId = sessionId;
        DeviceId = deviceId;
        Address = address;
    }
}