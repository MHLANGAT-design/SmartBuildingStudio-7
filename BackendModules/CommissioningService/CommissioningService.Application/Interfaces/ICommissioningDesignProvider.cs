using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace CommissioningService.Application.Interfaces;

public interface ICommissioningDesignProvider
{
    Task<IEnumerable<string>> GetExpectedDeviceIdsAsync(
        Guid floorplanId, 
        CancellationToken cancellationToken = default);
        
    Task<IEnumerable<string>> GetExpectedSceneIdsAsync(
        Guid floorplanId, 
        CancellationToken cancellationToken = default);
}