using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace CommissioningService.Application.Interfaces;

public interface IProgrammingResultProvider
{
    Task<Dictionary<string, int>> GetProgrammedAddressesAsync(
        string gatewayId, 
        string lineId, 
        CancellationToken cancellationToken = default);
}