using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Infrastructure.Network;

public class NetworkStateProvider
{
    public Task<NetworkStateDto> GetCurrentStateAsync(string gatewayId, string lineId, CancellationToken cancellationToken)
    {
        return Task.FromResult(new NetworkStateDto());
    }
}