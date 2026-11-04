using System;
using System.Threading;
using System.Threading.Tasks;

namespace CommissioningService.Infrastructure.Realtime;

public class CommissioningStatusBroadcaster
{
    public Task BroadcastStatusAsync(Guid sessionId, string status, CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}