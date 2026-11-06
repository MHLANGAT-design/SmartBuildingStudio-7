// GatewayManagementService.Infrastructure/Diagnostics/GatewayDiagnosticsExecutor.cs

using GatewayManagementService.Application.DTOs;
using GatewayManagementService.Application.Interfaces;

namespace GatewayManagementService.Infrastructure.Diagnostics;

public sealed class GatewayDiagnosticsExecutor
{
    private readonly IGatewayDiagnosticsProvider _provider;

    public GatewayDiagnosticsExecutor(IGatewayDiagnosticsProvider provider)
    {
        _provider = provider;
    }

    public Task<GatewayDiagnosticsDto> ExecuteAsync(Guid gatewayId, CancellationToken cancellationToken = default)
    {
        return _provider.RunAsync(gatewayId, cancellationToken);
    }
}