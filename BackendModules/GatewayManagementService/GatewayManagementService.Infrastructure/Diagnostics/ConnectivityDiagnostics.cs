// GatewayManagementService.Infrastructure/Diagnostics/ConnectivityDiagnostics.cs

using GatewayManagementService.Application.Interfaces;

namespace GatewayManagementService.Infrastructure.Diagnostics;

public sealed class ConnectivityDiagnostics
{
    private readonly IGatewayIntegrationService _integration;

    public ConnectivityDiagnostics(IGatewayIntegrationService integration)
    {
        _integration = integration;
    }

    public Task<bool> IsReachableAsync(Guid gatewayId, CancellationToken cancellationToken = default)
    {
        return _integration.PingAsync(gatewayId, cancellationToken);
    }
}