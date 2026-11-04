using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Infrastructure.Testing;

public class SignalVerificationExecutor
{
    public Task<TestResultDto> VerifySignalAsync(string deviceId, CancellationToken cancellationToken)
    {
        return Task.FromResult(new TestResultDto());
    }
}