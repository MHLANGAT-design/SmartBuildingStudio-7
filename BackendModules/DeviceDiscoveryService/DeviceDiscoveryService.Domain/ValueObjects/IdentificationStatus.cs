// ValueObjects/IdentificationStatus.cs

using System;

namespace DeviceDiscoveryService.Domain.ValueObjects;

public sealed class IdentificationStatus : IEquatable<IdentificationStatus>
{
    public enum StatusValue
    {
        Unknown,
        Pending,
        Succeeded,
        Partial,
        Failed,
    }

    public StatusValue Value { get; }
    private IdentificationStatus(StatusValue value) => Value = value;

    public static IdentificationStatus Unknown()   => new(StatusValue.Unknown);
    public static IdentificationStatus Pending()   => new(StatusValue.Pending);
    public static IdentificationStatus Succeeded() => new(StatusValue.Succeeded);
    public static IdentificationStatus Partial()   => new(StatusValue.Partial);
    public static IdentificationStatus Failed()    => new(StatusValue.Failed);

    public static IdentificationStatus FromName(string name)
    {
        if (Enum.TryParse<StatusValue>(name, ignoreCase: true, out var v))
            return new IdentificationStatus(v);
        throw new ArgumentException($"Invalid IdentificationStatus: {name}", nameof(name));
    }

    public bool IsSuccessful => Value is StatusValue.Succeeded or StatusValue.Partial;

    public override string ToString() => Value.ToString();

    public bool Equals(IdentificationStatus? other) => other is not null && Value == other.Value;
    public override bool Equals(object? obj) => Equals(obj as IdentificationStatus);
    public override int GetHashCode() => Value.GetHashCode();

    public static bool operator ==(IdentificationStatus? a, IdentificationStatus? b)
        => a is null ? b is null : a.Equals(b);
    public static bool operator !=(IdentificationStatus? a, IdentificationStatus? b) => !(a == b);
}