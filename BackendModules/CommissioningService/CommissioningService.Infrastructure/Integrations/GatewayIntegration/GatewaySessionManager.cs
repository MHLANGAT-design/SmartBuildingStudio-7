using System.Collections.Concurrent;
using System.Threading;
using System.Threading.Tasks;

namespace CommissioningService.Infrastructure.Integrations.GatewayIntegration;

public class GatewaySessionManager
{
    private readonly ConcurrentDictionary<string, bool> _activeSessions = new();

    public Task StartSessionAsync(string gatewayId, CancellationToken cancellationToken)
    {
        _activeSessions[gatewayId] = true;
        return Task.CompletedTask;
    }

    public Task EndSessionAsync(string gatewayId, CancellationToken cancellationToken)
    {
        _activeSessions.TryRemove(gatewayId, out _);
        return Task.CompletedTask;
    }
}