// GatewayManagementService.Infrastructure/Integrations/DeviceDiscoveryIntegration/DiscoverySessionResolver.cs

namespace GatewayManagementService.Infrastructure.Integrations.DeviceDiscoveryIntegration;

public sealed class DiscoverySessionResolver
{
    private readonly DeviceDiscoveryClient _client;

    public DiscoverySessionResolver(DeviceDiscoveryClient client)
    {
        _client = client;
    }

    public async Task<int> CountSessionsForGatewayAsync(Guid gatewayId, CancellationToken cancellationToken = default)
    {
        var sessions = await _client.GetSessionsForGatewayAsync(gatewayId, cancellationToken);
        return sessions?.Count ?? 0;
    }
}