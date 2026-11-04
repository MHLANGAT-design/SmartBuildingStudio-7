using System;

namespace CommissioningService.Domain.Exceptions;

public class CommissioningTestFailedException : Exception
{
    public string TestId { get; }
    public string Reason { get; }

    public CommissioningTestFailedException(string testId, string reason)
        : base($"Commissioning test '{testId}' failed: {reason}")
    {
        TestId = testId;
        Reason = reason;
    }
}