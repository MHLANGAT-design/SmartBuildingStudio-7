using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Application.Interfaces;

public interface INetworkTestProvider
{
    Task<NetworkStateDto> RunNetworkSweepAsync(
        string gatewayId, 
        string lineId, 
        CancellationToken cancellationToken = default);
}