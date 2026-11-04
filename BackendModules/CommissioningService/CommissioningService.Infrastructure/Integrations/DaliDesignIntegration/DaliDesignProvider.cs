using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.Interfaces;

namespace CommissioningService.Infrastructure.Integrations.DaliDesignIntegration;

public class DaliDesignProvider : ICommissioningDesignProvider
{
    public Task<IEnumerable<string>> GetExpectedDeviceIdsAsync(Guid floorplanId, CancellationToken cancellationToken = default)
    {
        return Task.FromResult<IEnumerable<string>>(new List<string>());
    }

    public Task<IEnumerable<string>> GetExpectedSceneIdsAsync(Guid floorplanId, CancellationToken cancellationToken = default)
    {
        return Task.FromResult<IEnumerable<string>>(new List<string>());
    }
}