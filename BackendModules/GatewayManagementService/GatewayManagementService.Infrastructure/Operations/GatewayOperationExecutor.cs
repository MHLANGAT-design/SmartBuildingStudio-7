// GatewayManagementService.Infrastructure/Operations/GatewayOperationExecutor.cs

using GatewayManagementService.Application.Interfaces;

namespace GatewayManagementService.Infrastructure.Operations;

public sealed class GatewayOperationExecutor
{
    private readonly IGatewayIntegrationService _integration;

    public GatewayOperationExecutor(IGatewayIntegrationService integration)
    {
        _integration = integration;
    }

    public Task<string> ExecuteAsync(Guid gatewayId, string operationType, string? payload, CancellationToken cancellationToken = default)
    {
        return _integration.ExecuteOperationAsync(gatewayId, operationType, payload, cancellationToken);
    }
}