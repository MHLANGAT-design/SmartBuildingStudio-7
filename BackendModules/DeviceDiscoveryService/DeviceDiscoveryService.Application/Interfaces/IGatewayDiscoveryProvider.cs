// Interfaces/IGatewayDiscoveryProvider.cs

namespace DeviceDiscoveryService.Application.Interfaces;

/// <summary>
/// A raw device returned by a gateway scan, before any domain mapping.
/// </summary>
public sealed record RawDiscoveredDevice(
    string ExternalId,
    string LineId,
    int? ShortAddress,
    bool IsOnline);

/// <summary>
/// Outbound port → GatewayManagement's physical discovery endpoint.
/// A mock implementation is swapped in when UseMockIntegrations = true.
/// </summary>
public interface IGatewayDiscoveryProvider
{
    Task<IReadOnlyList<RawDiscoveredDevice>> ScanLineAsync(
        string gatewayId,
        string lineId,
        CancellationToken cancellationToken = default);

    Task<bool> PingGatewayAsync(
        string gatewayId,
        CancellationToken cancellationToken = default);
}