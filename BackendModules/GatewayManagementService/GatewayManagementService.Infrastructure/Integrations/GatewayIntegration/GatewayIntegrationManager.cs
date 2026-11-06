// GatewayManagementService.Infrastructure/Integrations/GatewayIntegration/GatewayIntegrationManager.cs

using GatewayManagementService.Infrastructure.Integrations.GatewayIntegration.GatewayCommunication;
using Microsoft.Extensions.Logging;

namespace GatewayManagementService.Infrastructure.Integrations.GatewayIntegration;

/// <summary>
/// Selects the correct IGatewayCommunicationProvider for a gateway based on
/// its transport protocol, and routes every operation through it.
/// </summary>
public sealed class GatewayIntegrationManager
{
    private readonly HttpGatewayCommunicationProvider _http;
    private readonly TcpGatewayCommunicationProvider _tcp;
    private readonly MockGatewayCommunicationProvider _mock;
    private readonly GatewayIntegrationConfiguration _config;
    private readonly ILogger<GatewayIntegrationManager> _logger;

    public GatewayIntegrationManager(
        HttpGatewayCommunicationProvider http,
        TcpGatewayCommunicationProvider tcp,
        MockGatewayCommunicationProvider mock,
        GatewayIntegrationConfiguration config,
        ILogger<GatewayIntegrationManager> logger)
    {
        _http = http;
        _tcp = tcp;
        _mock = mock;
        _config = config;
        _logger = logger;
    }

    public IGatewayCommunicationProvider Resolve(string transport)
    {
        if (_config.UseMock) return _mock;

        return transport.ToLowerInvariant() switch
        {
            "http" => _http,
            "tcp" => _tcp,
            _ => throw new InvalidOperationException($"No communication provider for transport '{transport}'.")
        };
    }
}