using System.Threading;
using System.Threading.Tasks;

namespace CommissioningService.Infrastructure.Integrations.GatewayIntegration;

public class GatewayHealthProvider
{
    private readonly GatewayManagementClient _client;
    public GatewayHealthProvider(GatewayManagementClient client) => _client = client;

    public Task<bool> IsHealthyAsync(string gatewayId, CancellationToken cancellationToken)
        => _client.PingAsync(gatewayId, cancellationToken);
}