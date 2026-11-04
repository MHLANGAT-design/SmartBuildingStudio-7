using System;
using System.Threading;
using System.Threading.Tasks;

namespace CommissioningService.Infrastructure.FaultManagement;

public class FaultResolutionService
{
    public Task MarkResolvedAsync(Guid faultId, string resolutionNotes, CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}