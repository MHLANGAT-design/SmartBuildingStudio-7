using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.Interfaces;

namespace CommissioningService.Infrastructure.Integrations.DaliProgrammingIntegration;

public class DaliProgrammingProvider : IProgrammingResultProvider
{
    public Task<Dictionary<string, int>> GetProgrammedAddressesAsync(string gatewayId, string lineId, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new Dictionary<string, int>());
    }
}