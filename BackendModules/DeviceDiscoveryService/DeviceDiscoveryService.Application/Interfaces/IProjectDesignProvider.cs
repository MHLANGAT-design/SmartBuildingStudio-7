// Interfaces/IProjectDesignProvider.cs

namespace DeviceDiscoveryService.Application.Interfaces;

/// <summary>
/// A design fixture as returned by ProjectExplorer, before domain mapping.
/// </summary>
public sealed record RawDesignFixture(
    string FixtureId,
    string? ProductId,
    string? ProductName,
    string? DaliGroup,
    int? ShortAddress,
    double X,
    double Y,
    string? LineId);

/// <summary>
/// Outbound port → ProjectExplorer's design read endpoints.
/// A mock implementation is swapped in when UseMockIntegrations = true.
/// </summary>
public interface IProjectDesignProvider
{
    Task<IReadOnlyList<RawDesignFixture>> GetFixturesForLineAsync(
        Guid projectId,
        Guid drawingDocumentId,
        string lineId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RawDesignFixture>> GetFixturesForFloorAsync(
        Guid projectId,
        Guid floorId,
        CancellationToken cancellationToken = default);
}