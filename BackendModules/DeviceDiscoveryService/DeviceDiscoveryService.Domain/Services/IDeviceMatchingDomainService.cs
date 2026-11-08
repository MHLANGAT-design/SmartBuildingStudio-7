// Services/IDeviceMatchingDomainService.cs

using DeviceDiscoveryService.Domain.Entities;

namespace DeviceDiscoveryService.Domain.Services;

/// <summary>A design fixture, reduced to what matching needs.</summary>
public sealed record DesignFixtureSnapshot(
    string FixtureId,
    string? ProductId,
    string? ProductName,
    string? DaliGroup,
    int? ShortAddress,
    double X,
    double Y);

public interface IDeviceMatchingDomainService
{
    /// <summary>
    /// For one discovered device, evaluate against all design fixtures and
    /// return the match (or unmatched/conflict/ambiguous result).
    /// Pure domain operation — no I/O.
    /// </summary>
    DeviceMatch MatchSingle(
        DiscoveredDevice device,
        IReadOnlyList<DesignFixtureSnapshot> fixtures,
        DateTime matchedAt);
}