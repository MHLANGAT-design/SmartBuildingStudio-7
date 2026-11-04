using System.Threading;
using System.Threading.Tasks;

namespace CommissioningService.Application.Interfaces;

public interface IAddressingProvider
{
    Task<bool> AssignAddressAsync(
        string gatewayId, 
        string lineId, 
        string deviceExternalId, 
        int shortAddress, 
        CancellationToken cancellationToken = default);
}