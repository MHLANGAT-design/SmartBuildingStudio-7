using System;
using CommissioningService.Domain.Common;

namespace CommissioningService.Domain.Events;

public sealed class SceneTestCompletedEvent : DomainEvent
{
    public Guid SessionId { get; }
    public string SceneId { get; }
    public bool Passed { get; }

    public SceneTestCompletedEvent(Guid sessionId, string sceneId, bool passed)
    {
        SessionId = sessionId;
        SceneId = sceneId;
        Passed = passed;
    }
}