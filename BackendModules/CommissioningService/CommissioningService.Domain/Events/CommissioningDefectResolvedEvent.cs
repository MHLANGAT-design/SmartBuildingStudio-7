using System;
using CommissioningService.Domain.Common;

namespace CommissioningService.Domain.Events;

public sealed class CommissioningDefectResolvedEvent : DomainEvent
{
    public Guid SessionId { get; }
    public Guid DefectId { get; }
    public string ResolvedBy { get; }

    public CommissioningDefectResolvedEvent(Guid sessionId, Guid defectId, string resolvedBy)
    {
        SessionId = sessionId;
        DefectId = defectId;
        ResolvedBy = resolvedBy;
    }
}