// ValueObjects/DiscoverySessionId.cs

using System;

namespace DeviceDiscoveryService.Domain.ValueObjects;

public readonly record struct DiscoverySessionId(Guid Value)
{
    public static DiscoverySessionId New() => new(Guid.NewGuid());
    public static DiscoverySessionId From(Guid value) => new(value);
    public static DiscoverySessionId From(string value) => new(Guid.Parse(value));

    public override string ToString() => Value.ToString();
}