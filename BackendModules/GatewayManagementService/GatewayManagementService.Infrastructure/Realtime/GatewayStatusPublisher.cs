// GatewayManagementService.Infrastructure/Realtime/GatewayStatusPublisher.cs

using GatewayManagementService.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace GatewayManagementService.Infrastructure.Realtime;

public sealed class GatewayStatusPublisher : IGatewayProgressPublisher
{
    private readonly ILogger<GatewayStatusPublisher> _logger;

    public GatewayStatusPublisher(ILogger<GatewayStatusPublisher> logger)
    {
        _logger = logger;
    }

    public Task PublishStatusAsync(Guid gatewayId, string connectionStatus, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Gateway {GatewayId} → status: {Status}", gatewayId, connectionStatus);
        return Task.CompletedTask;
    }

    public Task PublishEventAsync(Guid gatewayId, string eventType, string? message, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Gateway {GatewayId} → event: {Type} ({Message})", gatewayId, eventType, message);
        return Task.CompletedTask;
    }
}