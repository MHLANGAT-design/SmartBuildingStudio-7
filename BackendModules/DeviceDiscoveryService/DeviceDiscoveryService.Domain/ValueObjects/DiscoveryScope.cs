// ValueObjects/DiscoveryScope.cs

using System;
using System.Collections.Generic;
using System.Linq;

namespace DeviceDiscoveryService.Domain.ValueObjects;

/// <summary>
/// The scope of a discovery session: which gateway, which line(s).
/// One session scans one gateway and one or more DALI lines on it.
/// </summary>
public sealed class DiscoveryScope : IEquatable<DiscoveryScope>
{
    public string GatewayId { get; }
    public IReadOnlyCollection<string> LineIds { get; }

    public DiscoveryScope(string gatewayId, IEnumerable<string> lineIds)
    {
        if (string.IsNullOrWhiteSpace(gatewayId))
            throw new ArgumentException("GatewayId is required.", nameof(gatewayId));

        var lines = (lineIds ?? throw new ArgumentNullException(nameof(lineIds)))
            .Where(l => !string.IsNullOrWhiteSpace(l))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (lines.Count == 0)
            throw new ArgumentException("At least one line id is required.", nameof(lineIds));

        GatewayId = gatewayId.Trim();
        LineIds = lines.AsReadOnly();
    }

    public static DiscoveryScope SingleLine(string gatewayId, string lineId)
        => new(gatewayId, new[] { lineId });

    public override string ToString() => $"{GatewayId} / {string.Join(",", LineIds)}";

    public bool Equals(DiscoveryScope? other)
    {
        if (other is null) return false;
        if (!string.Equals(GatewayId, other.GatewayId, StringComparison.OrdinalIgnoreCase)) return false;
        return LineIds.OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
                      .SequenceEqual(
                          other.LineIds.OrderBy(x => x, StringComparer.OrdinalIgnoreCase),
                          StringComparer.OrdinalIgnoreCase);
    }

    public override bool Equals(object? obj) => Equals(obj as DiscoveryScope);
    public override int GetHashCode()
        => HashCode.Combine(
            GatewayId.ToUpperInvariant(),
            string.Join(",", LineIds.OrderBy(x => x, StringComparer.OrdinalIgnoreCase)).ToUpperInvariant());
}