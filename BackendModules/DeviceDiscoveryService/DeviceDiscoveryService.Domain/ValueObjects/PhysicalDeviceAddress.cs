// ValueObjects/PhysicalDeviceAddress.cs

using System;

namespace DeviceDiscoveryService.Domain.ValueObjects;

/// <summary>
/// A DALI short address combined with the line it lives on.
/// Immutable. Two addresses are equal if both line and address match.
/// </summary>
public sealed class PhysicalDeviceAddress : IEquatable<PhysicalDeviceAddress>
{
    public string LineId { get; }
    /// <summary>DALI short address, 0-63. Null when the device is not yet addressed.</summary>
    public int? ShortAddress { get; }

    public PhysicalDeviceAddress(string lineId, int? shortAddress)
    {
        if (string.IsNullOrWhiteSpace(lineId))
            throw new ArgumentException("LineId is required.", nameof(lineId));
        if (shortAddress is < 0 or > 63)
            throw new ArgumentOutOfRangeException(nameof(shortAddress),
                "DALI short address must be between 0 and 63.");

        LineId = lineId.Trim();
        ShortAddress = shortAddress;
    }

    public static PhysicalDeviceAddress Unaddressed(string lineId) => new(lineId, null);
    public bool IsAddressed => ShortAddress.HasValue;

    public override string ToString()
        => $"{LineId}:{(ShortAddress?.ToString("D2") ?? "--")}";

    public bool Equals(PhysicalDeviceAddress? other)
    {
        if (other is null) return false;
        return string.Equals(LineId, other.LineId, StringComparison.OrdinalIgnoreCase)
            && ShortAddress == other.ShortAddress;
    }

    public override bool Equals(object? obj) => Equals(obj as PhysicalDeviceAddress);
    public override int GetHashCode()
        => HashCode.Combine(LineId.ToUpperInvariant(), ShortAddress);
}