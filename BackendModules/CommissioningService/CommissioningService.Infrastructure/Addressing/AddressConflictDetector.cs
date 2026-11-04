using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace CommissioningService.Infrastructure.Addressing;

public class AddressConflictDetector
{
    public Task<bool> HasConflictAsync(IEnumerable<int> currentAddresses, CancellationToken cancellationToken)
    {
        var seen = new HashSet<int>();
        foreach (var addr in currentAddresses)
        {
            if (!seen.Add(addr)) return Task.FromResult(true);
        }
        return Task.FromResult(false);
    }
}