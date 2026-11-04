using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.Interfaces;

namespace CommissioningService.Infrastructure.Addressing;

public class CommissioningAddressingProvider : IAddressingProvider
{
    public Task<bool> AssignAddressAsync(string gatewayId, string lineId, string deviceExternalId, int shortAddress, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(true);
    }
}