using System.Threading;
using System.Threading.Tasks;

namespace CommissioningService.Application.Interfaces;

public interface IGatewayCommunicationProvider
{
    Task<bool> PingGatewayAsync(string gatewayId, CancellationToken cancellationToken = default);
    
    Task SendCommandAsync(
        string gatewayId, 
        string command, 
        CancellationToken cancellationToken = default);
}