// GatewayManagementService.Application/Interfaces/IGatewayProgressPublisher.cs

namespace GatewayManagementService.Application.Interfaces;

public interface IGatewayProgressPublisher
{
    Task PublishStatusAsync(Guid gatewayId, string connectionStatus, CancellationToken cancellationToken = default);
    Task PublishEventAsync(Guid gatewayId, string eventType, string? message, CancellationToken cancellationToken = default);
}