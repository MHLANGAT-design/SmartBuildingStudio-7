using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Infrastructure.FaultManagement;

public class FaultHistoryRepository
{
    public Task<IEnumerable<FaultDto>> GetHistoryAsync(Guid sessionId, CancellationToken cancellationToken)
    {
        return Task.FromResult<IEnumerable<FaultDto>>(new List<FaultDto>());
    }
}