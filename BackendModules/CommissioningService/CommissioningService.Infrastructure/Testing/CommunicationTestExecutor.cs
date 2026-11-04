using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Infrastructure.Testing;

public class CommunicationTestExecutor
{
    public Task<TestResultDto> TestPingAsync(string deviceId, CancellationToken cancellationToken)
    {
        return Task.FromResult(new TestResultDto());
    }
}