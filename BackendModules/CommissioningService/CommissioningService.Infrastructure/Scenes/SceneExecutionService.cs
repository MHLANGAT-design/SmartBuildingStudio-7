using System.Threading;
using System.Threading.Tasks;

namespace CommissioningService.Infrastructure.Scenes;

public class SceneExecutionService
{
    public Task TriggerSceneAsync(string gatewayId, string sceneId, CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}