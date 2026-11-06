// GatewayManagementService.Infrastructure/Realtime/GatewayStatusBroadcaster.cs

using Microsoft.Extensions.Logging;

namespace GatewayManagementService.Infrastructure.Realtime;

public sealed class GatewayStatusBroadcaster
{
    private readonly ILogger<GatewayStatusBroadcaster> _logger;

    public GatewayStatusBroadcaster(ILogger<GatewayStatusBroadcaster> logger)
    {
        _logger = logger;
    }

    public Task BroadcastAsync(Guid gatewayId, string payload, CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Broadcast for {GatewayId}: {Payload}", gatewayId, payload);
        return Task.CompletedTask;
    }
}