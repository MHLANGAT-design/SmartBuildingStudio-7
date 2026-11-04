using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Infrastructure.FaultManagement;

public class FaultCorrelationService
{
    public Task<IEnumerable<FaultDto>> CorrelateFaultsAsync(IEnumerable<FaultDto> newFaults, IEnumerable<FaultDto> existingFaults, CancellationToken cancellationToken)
    {
        return Task.FromResult(newFaults);
    }
}