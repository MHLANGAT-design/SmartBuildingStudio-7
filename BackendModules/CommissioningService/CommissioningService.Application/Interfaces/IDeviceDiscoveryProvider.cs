using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace CommissioningService.Application.Interfaces;

public interface IDeviceDiscoveryProvider
{
    Task<IEnumerable<string>> DiscoverDevicesAsync(
        string gatewayId, 
        string lineId, 
        CancellationToken cancellationToken = default);
}