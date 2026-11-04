using System;
using CommissioningService.Domain.Common;

namespace CommissioningService.Domain.Events;

public sealed class CommissioningSessionStartedEvent : DomainEvent
{
    public Guid SessionId { get; }

    public CommissioningSessionStartedEvent(Guid sessionId)
    {
        SessionId = sessionId;
    }
}