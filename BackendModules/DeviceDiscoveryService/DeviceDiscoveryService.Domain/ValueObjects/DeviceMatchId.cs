// ValueObjects/DeviceMatchId.cs

using System;

namespace DeviceDiscoveryService.Domain.ValueObjects;

public readonly record struct DeviceMatchId(Guid Value)
{
    public static DeviceMatchId New() => new(Guid.NewGuid());
    public override string ToString() => Value.ToString();
}