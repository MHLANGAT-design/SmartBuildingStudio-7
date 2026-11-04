using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace CommissioningService.Infrastructure.Addressing;

public class AddressAssignmentResolver
{
    public Task<int> FindNextAvailableAddressAsync(string lineId, IEnumerable<int> usedAddresses, CancellationToken cancellationToken)
    {
        for (int i = 0; i < 64; i++)
        {
            if (!System.Linq.Enumerable.Contains(usedAddresses, i)) return Task.FromResult(i);
        }
        return Task.FromResult(-1);
    }
}