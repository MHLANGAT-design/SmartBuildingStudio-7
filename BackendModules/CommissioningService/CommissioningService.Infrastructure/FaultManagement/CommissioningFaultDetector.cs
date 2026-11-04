using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Infrastructure.FaultManagement;

public class CommissioningFaultDetector
{
    public Task<IEnumerable<FaultDto>> DetectFaultsAsync(IEnumerable<TestResultDto> testResults, CancellationToken cancellationToken)
    {
        return Task.FromResult<IEnumerable<FaultDto>>(new List<FaultDto>());
    }
}