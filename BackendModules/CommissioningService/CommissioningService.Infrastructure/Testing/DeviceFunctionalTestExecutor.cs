using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Infrastructure.Testing;

public class DeviceFunctionalTestExecutor
{
    public Task<IEnumerable<TestResultDto>> RunTestsAsync(IEnumerable<string> deviceIds, CancellationToken cancellationToken)
    {
        return Task.FromResult<IEnumerable<TestResultDto>>(new List<TestResultDto>());
    }
}