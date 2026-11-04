using System;
using CommissioningService.Domain.Common;

namespace CommissioningService.Domain.Events;

public sealed class CommissioningSessionApprovedEvent : DomainEvent
{
    public Guid SessionId { get; }
    public string ApprovedBy { get; }
    public DateTime ApprovedAt { get; }

    public CommissioningSessionApprovedEvent(Guid sessionId, string approvedBy)
    {
        SessionId = sessionId;
        ApprovedBy = approvedBy;
        ApprovedAt = DateTime.UtcNow;
    }
}