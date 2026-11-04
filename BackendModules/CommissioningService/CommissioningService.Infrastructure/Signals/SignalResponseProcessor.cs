using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Infrastructure.Signals;

public class SignalResponseProcessor
{
    public Task ProcessSignalResponseAsync(TestResultDto result, CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}