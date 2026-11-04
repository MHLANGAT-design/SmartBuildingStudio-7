using System;
using CommissioningService.Domain.Common;

namespace CommissioningService.Domain.Entities;

public class SceneTest : Entity<Guid>
{
    public string SceneId { get; private set; } = string.Empty;
    public string SceneName { get; private set; } = string.Empty;
    public string Status { get; private set; } = string.Empty;
    public DateTime ExecutedAt { get; private set; }

    // EF Core constructor
    private SceneTest() { }

    // Public constructor (changed from internal to public)
    public SceneTest(string sceneId, string sceneName, string status)
    {
        Id = Guid.NewGuid();
        SceneId = sceneId;
        SceneName = sceneName;
        Status = status;
        ExecutedAt = DateTime.UtcNow;
    }
}