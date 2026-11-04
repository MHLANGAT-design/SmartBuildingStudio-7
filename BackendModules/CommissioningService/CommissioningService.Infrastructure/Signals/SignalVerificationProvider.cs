using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Infrastructure.Signals;

public class SignalVerificationProvider
{
    public Task<TestResultDto> VerifySignalsAsync(string deviceId, CancellationToken cancellationToken)
    {
        return Task.FromResult(new TestResultDto());
    }
}