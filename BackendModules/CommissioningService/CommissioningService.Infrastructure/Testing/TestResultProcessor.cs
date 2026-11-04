using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Infrastructure.Testing;

public class TestResultProcessor
{
    public Task ProcessTestResultsAsync(IEnumerable<TestResultDto> results, CancellationToken cancellationToken)
    {
        // Analyze results, generate faults, etc.
        return Task.CompletedTask;
    }
}