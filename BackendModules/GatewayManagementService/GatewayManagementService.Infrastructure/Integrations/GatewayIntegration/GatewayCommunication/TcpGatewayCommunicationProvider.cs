// GatewayManagementService.Infrastructure/Integrations/GatewayIntegration/GatewayCommunication/TcpGatewayCommunicationProvider.cs

using System.Net.Sockets;
using System.Text;

namespace GatewayManagementService.Infrastructure.Integrations.GatewayIntegration.GatewayCommunication;

public sealed class TcpGatewayCommunicationProvider : IGatewayCommunicationProvider
{
    private const int TimeoutMs = 5000;

    public async Task<bool> PingAsync(string endpoint, CancellationToken cancellationToken = default)
    {
        try
        {
            var (host, port) = ParseEndpoint(endpoint);
            using var client = new TcpClient();
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(TimeoutMs);

            await client.ConnectAsync(host, port, cts.Token);
            return client.Connected;
        }
        catch
        {
            return false;
        }
    }

    public async Task<string> SendAsync(string endpoint, string payload, CancellationToken cancellationToken = default)
    {
        var (host, port) = ParseEndpoint(endpoint);
        using var client = new TcpClient();
        await client.ConnectAsync(host, port, cancellationToken);

        using var stream = client.GetStream();
        var bytes = Encoding.UTF8.GetBytes(payload);
        await stream.WriteAsync(bytes, cancellationToken);

        var buffer = new byte[4096];
        var read = await stream.ReadAsync(buffer, cancellationToken);
        return Encoding.UTF8.GetString(buffer, 0, read);
    }

    private static (string host, int port) ParseEndpoint(string endpoint)
    {
        var parts = endpoint.Split(':');
        if (parts.Length != 2 || !int.TryParse(parts[1], out var port))
            throw new ArgumentException($"Invalid TCP endpoint '{endpoint}'. Expected 'host:port'.");
        return (parts[0], port);
    }
}