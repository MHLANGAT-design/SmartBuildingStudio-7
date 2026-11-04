using System;
using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace CommissioningService.Infrastructure.Integrations.GatewayIntegration;

public class GatewayCommunicationProvider : IGatewayCommunicationProvider
{
    private readonly GatewayManagementClient _client;
    private readonly ILogger<GatewayCommunicationProvider> _logger;

    public GatewayCommunicationProvider(
        GatewayManagementClient client,
        ILogger<GatewayCommunicationProvider> logger)
    {
        _client = client;
        _logger = logger;
    }

    public async Task<bool> PingGatewayAsync(string gatewayId, CancellationToken cancellationToken = default)
    {
        try
        {
            return await _client.PingAsync(gatewayId, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Gateway {GatewayId} is unreachable.", gatewayId);
            return false;
        }
    }

    public async Task SendCommandAsync(string gatewayId, string command, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Sending raw command to gateway {GatewayId}: {Command}", gatewayId, command);
            await _client.SendCommandAsync(gatewayId, command, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send command to gateway {GatewayId}", gatewayId);
            throw new InvalidOperationException($"Gateway communication failed for {gatewayId}.", ex);
        }
    }
}