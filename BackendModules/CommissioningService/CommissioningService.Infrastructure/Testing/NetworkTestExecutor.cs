using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.DTOs;
using CommissioningService.Application.Interfaces;

namespace CommissioningService.Infrastructure.Testing;

public class NetworkTestExecutor
{
    private readonly INetworkTestProvider _networkProvider;
    public NetworkTestExecutor(INetworkTestProvider networkProvider) => _networkProvider = networkProvider;

    public async Task<IEnumerable<TestResultDto>> RunTestsAsync(CancellationToken cancellationToken)
    {
        // Run sweep, process results
        return new List<TestResultDto>();
    }
}