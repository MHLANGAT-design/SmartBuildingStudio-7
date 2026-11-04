using System;
using CommissioningService.Domain.Common;

namespace CommissioningService.Domain.Events;

public sealed class CommissioningSessionCreatedEvent : DomainEvent
{
    public Guid SessionId { get; }
    public Guid ProjectId { get; }
    public Guid FloorplanId { get; }
    public string CreatedBy { get; }

    public CommissioningSessionCreatedEvent(Guid sessionId, Guid projectId, Guid floorplanId, string createdBy)
    {
        SessionId = sessionId;
        ProjectId = projectId;
        FloorplanId = floorplanId;
        CreatedBy = createdBy;
    }
}