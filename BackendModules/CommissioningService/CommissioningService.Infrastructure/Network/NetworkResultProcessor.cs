using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Infrastructure.Network;

public class NetworkResultProcessor
{
    public Task ProcessSweepResultsAsync(NetworkStateDto state, CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}