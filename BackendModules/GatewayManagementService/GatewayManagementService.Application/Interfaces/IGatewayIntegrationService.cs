// GatewayManagementService.Application/Interfaces/IGatewayIntegrationService.cs

using GatewayManagementService.Application.DTOs;

namespace GatewayManagementService.Application.Interfaces;

/// <summary>
/// Peer interface into the GatewayIntegration subsystem. Implemented in
/// Infrastructure (Integrations/GatewayIntegration/). Provides the transport-
/// level capabilities the application layer needs without ever exposing HTTP
/// or TCP details to the handlers.
/// </summary>
public interface IGatewayIntegrationService
{
    Task<bool> PingAsync(Guid gatewayId, CancellationToken cancellationToken = default);
    Task<GatewayDiagnosticsDto> RunDiagnosticsAsync(Guid gatewayId, CancellationToken cancellationToken = default);
    Task<string> ExecuteOperationAsync(Guid gatewayId, string operationType, string? payload, CancellationToken cancellationToken = default);
}