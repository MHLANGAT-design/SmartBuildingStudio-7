using System;
using CommissioningService.Domain.Common;

namespace CommissioningService.Domain.Events;

public sealed class CommissioningSessionCompletedEvent : DomainEvent
{
    public Guid SessionId { get; }
    public DateTime CompletedAt { get; }

    public CommissioningSessionCompletedEvent(Guid sessionId)
    {
        SessionId = sessionId;
        CompletedAt = DateTime.UtcNow;
    }
}