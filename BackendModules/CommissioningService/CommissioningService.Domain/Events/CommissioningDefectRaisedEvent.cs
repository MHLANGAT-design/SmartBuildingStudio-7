using System;
using CommissioningService.Domain.Common;

namespace CommissioningService.Domain.Events;

public sealed class CommissioningDefectRaisedEvent : DomainEvent
{
    public Guid SessionId { get; }
    public Guid DefectId { get; }
    public string TargetId { get; }
    public string Severity { get; }

    public CommissioningDefectRaisedEvent(Guid sessionId, Guid defectId, string targetId, string severity)
    {
        SessionId = sessionId;
        DefectId = defectId;
        TargetId = targetId;
        Severity = severity;
    }
}