// GatewayManagementService.Infrastructure/Integrations/GatewayIntegration/GatewayCommunication/MockGatewayCommunicationProvider.cs

namespace GatewayManagementService.Infrastructure.Integrations.GatewayIntegration.GatewayCommunication;

/// <summary>
/// Deterministic mock gateway provider used when UseMockIntegrations = true.
/// Returns success for every ping and deterministic synthetic responses for
/// every command, so the whole discovery/commissioning pipeline can run
/// without any physical hardware.
/// </summary>
public sealed class MockGatewayCommunicationProvider : IGatewayCommunicationProvider
{
    private readonly int _pingLatencyMs;
    private readonly Random _random = new(42);

    public MockGatewayCommunicationProvider(int pingLatencyMs = 40)
    {
        _pingLatencyMs = pingLatencyMs;
    }

    public async Task<bool> PingAsync(string endpoint, CancellationToken cancellationToken = default)
    {
        await Task.Delay(_pingLatencyMs, cancellationToken);
        // 5% simulated ping failures so the UI shows real reconnect behavior
        return _random.NextDouble() > 0.05;
    }

    public async Task<string> SendAsync(string endpoint, string payload, CancellationToken cancellationToken = default)
    {
        await Task.Delay(_pingLatencyMs, cancellationToken);
        return $"{{\"success\":true,\"endpoint\":\"{endpoint}\",\"echo\":{System.Text.Json.JsonSerializer.Serialize(payload)}}}";
    }
}