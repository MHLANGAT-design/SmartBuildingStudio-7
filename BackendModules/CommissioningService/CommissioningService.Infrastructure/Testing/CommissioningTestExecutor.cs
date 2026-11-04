using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.DTOs;
using CommissioningService.Application.Interfaces;

namespace CommissioningService.Infrastructure.Testing;

public class CommissioningTestExecutor : ICommissioningTestExecutor
{
    private readonly DeviceFunctionalTestExecutor _deviceExecutor;
    private readonly NetworkTestExecutor _networkExecutor;
    private readonly SceneTestExecutor _sceneExecutor;

    public CommissioningTestExecutor(
        DeviceFunctionalTestExecutor deviceExecutor,
        NetworkTestExecutor networkExecutor,
        SceneTestExecutor sceneExecutor)
    {
        _deviceExecutor = deviceExecutor;
        _networkExecutor = networkExecutor;
        _sceneExecutor = sceneExecutor;
    }

    public async Task<IEnumerable<TestResultDto>> ExecuteTestsAsync(Guid sessionId, string testType, IEnumerable<string> targetDeviceIds, CancellationToken cancellationToken = default)
    {
        if (testType == "FUNCTIONAL")
            return await _deviceExecutor.RunTestsAsync(targetDeviceIds, cancellationToken);
        if (testType == "NETWORK")
            return await _networkExecutor.RunTestsAsync(cancellationToken);

        return new List<TestResultDto>();
    }
}