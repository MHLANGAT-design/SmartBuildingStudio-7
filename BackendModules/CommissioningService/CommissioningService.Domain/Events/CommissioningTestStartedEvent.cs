using System;
using CommissioningService.Domain.Common;

namespace CommissioningService.Domain.Events;

public sealed class CommissioningTestStartedEvent : DomainEvent
{
    public Guid SessionId { get; }
    public Guid TestId { get; }
    public string TestType { get; }

    public CommissioningTestStartedEvent(Guid sessionId, Guid testId, string testType)
    {
        SessionId = sessionId;
        TestId = testId;
        TestType = testType;
    }
}