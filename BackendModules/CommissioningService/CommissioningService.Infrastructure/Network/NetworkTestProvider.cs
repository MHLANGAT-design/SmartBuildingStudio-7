using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.DTOs;
using CommissioningService.Application.Interfaces;

namespace CommissioningService.Infrastructure.Network;

public class NetworkTestProvider : INetworkTestProvider
{
    public Task<NetworkStateDto> RunNetworkSweepAsync(string gatewayId, string lineId, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new NetworkStateDto { LineId = lineId, GatewayId = gatewayId });
    }
}