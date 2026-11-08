// ValueObjects/DeviceIdentificationId.cs

using System;

namespace DeviceDiscoveryService.Domain.ValueObjects;

public readonly record struct DeviceIdentificationId(Guid Value)
{
    public static DeviceIdentificationId New() => new(Guid.NewGuid());
    public override string ToString() => Value.ToString();
}