using System;
using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.Interfaces;

namespace CommissioningService.Infrastructure.Audit;

public class CommissioningAuditService : ICommissioningAuditService
{
    public Task LogActionAsync(Guid sessionId, string action, string performedBy, string details, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }
}