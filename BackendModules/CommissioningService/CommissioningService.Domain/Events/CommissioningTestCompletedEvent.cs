using System;
using CommissioningService.Domain.Common;

namespace CommissioningService.Domain.Events;

public sealed class CommissioningTestCompletedEvent : DomainEvent
{
    public Guid SessionId { get; }
    public Guid TestId { get; }
    public string Result { get; }
    public long DurationMs { get; }

    public CommissioningTestCompletedEvent(Guid sessionId, Guid testId, string result, long durationMs)
    {
        SessionId = sessionId;
        TestId = testId;
        Result = result;
        DurationMs = durationMs;
    }
}