using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Infrastructure.Testing;

public class SceneTestExecutor
{
    public Task<IEnumerable<TestResultDto>> RunScenesAsync(IEnumerable<string> sceneIds, CancellationToken cancellationToken)
    {
        return Task.FromResult<IEnumerable<TestResultDto>>(new List<TestResultDto>());
    }
}