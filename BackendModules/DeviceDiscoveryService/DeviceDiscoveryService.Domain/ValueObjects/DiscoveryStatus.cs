// ValueObjects/DiscoveryStatus.cs

using System;
using System.Collections.Generic;

namespace DeviceDiscoveryService.Domain.ValueObjects;

public sealed class DiscoveryStatus : IEquatable<DiscoveryStatus>
{
    public enum StatusValue
    {
        Idle,
        Discovering,
        Identifying,
        Matching,
        Completed,
        Failed,
        Cancelled,
        Stopped,
    }

    public StatusValue Value { get; }

    private DiscoveryStatus(StatusValue value) => Value = value;

    public static DiscoveryStatus Idle()         => new(StatusValue.Idle);
    public static DiscoveryStatus Discovering()  => new(StatusValue.Discovering);
    public static DiscoveryStatus Identifying()  => new(StatusValue.Identifying);
    public static DiscoveryStatus Matching()     => new(StatusValue.Matching);
    public static DiscoveryStatus Completed()    => new(StatusValue.Completed);
    public static DiscoveryStatus Failed()       => new(StatusValue.Failed);
    public static DiscoveryStatus Cancelled()    => new(StatusValue.Cancelled);
    public static DiscoveryStatus Stopped()      => new(StatusValue.Stopped);

    public static DiscoveryStatus FromName(string name)
    {
        if (Enum.TryParse<StatusValue>(name, ignoreCase: true, out var v))
            return new DiscoveryStatus(v);
        throw new ArgumentException($"Invalid DiscoveryStatus: {name}", nameof(name));
    }

    public bool IsTerminal => Value is StatusValue.Completed
                                     or StatusValue.Failed
                                     or StatusValue.Cancelled;

    public bool IsActive => Value is StatusValue.Discovering
                                   or StatusValue.Identifying
                                   or StatusValue.Matching;

    public override string ToString() => Value.ToString();

    public bool Equals(DiscoveryStatus? other) => other is not null && Value == other.Value;
    public override bool Equals(object? obj) => Equals(obj as DiscoveryStatus);
    public override int GetHashCode() => Value.GetHashCode();

    public static bool operator ==(DiscoveryStatus? a, DiscoveryStatus? b)
        => a is null ? b is null : a.Equals(b);
    public static bool operator !=(DiscoveryStatus? a, DiscoveryStatus? b) => !(a == b);

    public static IReadOnlyCollection<StatusValue> AllValues { get; } =
        (StatusValue[])Enum.GetValues(typeof(StatusValue));
}