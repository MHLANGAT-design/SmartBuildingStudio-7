// GatewayManagementService.Application/Interfaces/IGatewayCommunicationProvider.cs

namespace GatewayManagementService.Application.Interfaces;

/// <summary>
/// Low-level transport interface implemented per-protocol in
/// Integrations/GatewayIntegration/GatewayCommunication/. The Application
/// layer only ever calls this through IGatewayIntegrationService.
/// </summary>
public interface IGatewayCommunicationProvider
{
    Task<bool> PingAsync(string endpoint, CancellationToken cancellationToken = default);
    Task<string> SendAsync(string endpoint, string payload, CancellationToken cancellationToken = default);
}