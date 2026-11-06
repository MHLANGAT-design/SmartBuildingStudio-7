// GatewayManagementService.Infrastructure/Integrations/GatewayIntegration/GatewayCommunication/IGatewayCommunicationProvider.cs

namespace GatewayManagementService.Infrastructure.Integrations.GatewayIntegration.GatewayCommunication;

public interface IGatewayCommunicationProvider
{
    Task<bool> PingAsync(string endpoint, CancellationToken cancellationToken = default);
    Task<string> SendAsync(string endpoint, string payload, CancellationToken cancellationToken = default);
}