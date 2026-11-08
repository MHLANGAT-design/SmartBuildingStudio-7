// Integrations/GatewayDiscoveryIntegration/MockGatewayDiscoveryProvider.cs

using DeviceDiscoveryService.Application.Interfaces;

namespace DeviceDiscoveryService.Infrastructure.Integrations.GatewayDiscoveryIntegration;

/// <summary>
/// Mock provider — returns 3 synthetic devices per line after a 300ms delay.
/// Used when UseMockIntegrations = true.
/// </summary>
public sealed class MockGatewayDiscoveryProvider : IGatewayDiscoveryProvider
{
    public async Task<IReadOnlyList<RawDiscoveredDevice>> ScanLineAsync(
        string gatewayId,
        string lineId,
        CancellationToken cancellationToken = default)
    {
        await Task.Delay(300, cancellationToken);

        return new[]
        {
            new RawDiscoveredDevice($"{lineId}-dev-001", lineId, 1, true),
            new RawDiscoveredDevice($"{lineId}-dev-002", lineId, 2, true),
            new RawDiscoveredDevice($"{lineId}-dev-003", lineId, 3, true),
        };
    }

    public Task<bool> PingGatewayAsync(string gatewayId, CancellationToken cancellationToken = default)
        => Task.FromResult(true);
}