using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.DTOs;
using CommissioningService.Application.Interfaces;

namespace CommissioningService.Infrastructure.Scenes;

public class SceneTestProvider : ISceneTestProvider
{
    public Task<IEnumerable<SceneTestDto>> RunScenesAsync(string gatewayId, IEnumerable<string> sceneIds, CancellationToken cancellationToken = default)
    {
        return Task.FromResult<IEnumerable<SceneTestDto>>(new List<SceneTestDto>());
    }
}