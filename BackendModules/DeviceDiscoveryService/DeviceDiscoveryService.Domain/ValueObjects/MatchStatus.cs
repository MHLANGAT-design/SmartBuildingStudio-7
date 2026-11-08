// ValueObjects/MatchStatus.cs

using System;

namespace DeviceDiscoveryService.Domain.ValueObjects;

public sealed class MatchStatus : IEquatable<MatchStatus>
{
    public enum StatusValue
    {
        Unknown,
        Matched,
        Unmatched,
        Conflict,
        Ambiguous,
    }

    public StatusValue Value { get; }
    private MatchStatus(StatusValue value) => Value = value;

    public static MatchStatus Unknown()   => new(StatusValue.Unknown);
    public static MatchStatus Matched()   => new(StatusValue.Matched);
    public static MatchStatus Unmatched() => new(StatusValue.Unmatched);
    public static MatchStatus Conflict()  => new(StatusValue.Conflict);
    public static MatchStatus Ambiguous() => new(StatusValue.Ambiguous);

    public static MatchStatus FromName(string name)
    {
        if (Enum.TryParse<StatusValue>(name, ignoreCase: true, out var v))
            return new MatchStatus(v);
        throw new ArgumentException($"Invalid MatchStatus: {name}", nameof(name));
    }

    public bool IsResolved => Value is StatusValue.Matched;
    public bool NeedsAttention => Value is StatusValue.Conflict or StatusValue.Ambiguous;

    public override string ToString() => Value.ToString();

    public bool Equals(MatchStatus? other) => other is not null && Value == other.Value;
    public override bool Equals(object? obj) => Equals(obj as MatchStatus);
    public override int GetHashCode() => Value.GetHashCode();

    public static bool operator ==(MatchStatus? a, MatchStatus? b)
        => a is null ? b is null : a.Equals(b);
    public static bool operator !=(MatchStatus? a, MatchStatus? b) => !(a == b);
}