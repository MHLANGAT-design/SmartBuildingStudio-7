using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Application.Interfaces;

public interface ISceneTestProvider
{
    Task<IEnumerable<SceneTestDto>> RunScenesAsync(
        string gatewayId, 
        IEnumerable<string> sceneIds, 
        CancellationToken cancellationToken = default);
}