using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Application.Interfaces;

public interface ICommissioningTestExecutor
{
    Task<IEnumerable<TestResultDto>> ExecuteTestsAsync(
        Guid sessionId, 
        string testType, 
        IEnumerable<string> targetDeviceIds, 
        CancellationToken cancellationToken = default);
}