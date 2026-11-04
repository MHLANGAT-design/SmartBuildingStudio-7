using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Infrastructure.Testing;

public class AddressVerificationExecutor
{
    public Task<bool> VerifyAddressAsync(string deviceId, int expectedAddress, CancellationToken cancellationToken)
    {
        return Task.FromResult(true);
    }
}