using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Infrastructure.Realtime;

public class CommissioningProgressConsumer
{
    public Task ConsumeProgressAsync(CommissioningProgressDto progress, CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}