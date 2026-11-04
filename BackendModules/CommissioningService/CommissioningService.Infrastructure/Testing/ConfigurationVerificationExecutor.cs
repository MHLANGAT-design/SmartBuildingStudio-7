using System.Threading;
using System.Threading.Tasks;

namespace CommissioningService.Infrastructure.Testing;

public class ConfigurationVerificationExecutor
{
    public Task<bool> VerifyConfigAsync(string deviceId, CancellationToken cancellationToken)
    {
        return Task.FromResult(true);
    }
}