// ValueObjects/DiscoveredDeviceId.cs

using System;

namespace DeviceDiscoveryService.Domain.ValueObjects;

public readonly record struct DiscoveredDeviceId(Guid Value)
{
    public static DiscoveredDeviceId New() => new(Guid.NewGuid());
    public static DiscoveredDeviceId From(Guid value) => new(value);

    public override string ToString() => Value.ToString();
}