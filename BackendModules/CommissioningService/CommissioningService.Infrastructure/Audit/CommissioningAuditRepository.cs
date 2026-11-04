using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace CommissioningService.Infrastructure.Audit;

public class CommissioningAuditRepository
{
    public Task<IEnumerable<CommissioningAuditEntry>> GetEntriesAsync(Guid sessionId, CancellationToken cancellationToken)
    {
        return Task.FromResult<IEnumerable<CommissioningAuditEntry>>(new List<CommissioningAuditEntry>());
    }
}