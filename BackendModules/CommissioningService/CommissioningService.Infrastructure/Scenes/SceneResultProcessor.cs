using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Infrastructure.Scenes;

public class SceneResultProcessor
{
    public Task ProcessSceneResultAsync(SceneTestDto result, CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}