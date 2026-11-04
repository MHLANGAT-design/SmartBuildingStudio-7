using System.Threading;
using System.Threading.Tasks;

namespace CommissioningService.Infrastructure.Addressing;

public class AddressVerificationService
{
    public Task<bool> VerifyAddressOnHardwareAsync(string deviceId, int expectedAddress, CancellationToken cancellationToken)
    {
        return Task.FromResult(true);
    }
}