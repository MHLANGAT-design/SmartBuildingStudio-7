// GatewayManagementService.Application/Interfaces/IGatewayDiagnosticsProvider.cs

using GatewayManagementService.Application.DTOs;

namespace GatewayManagementService.Application.Interfaces;

public interface IGatewayDiagnosticsProvider
{
    Task<GatewayDiagnosticsDto> RunAsync(Guid gatewayId, CancellationToken cancellationToken = default);
}