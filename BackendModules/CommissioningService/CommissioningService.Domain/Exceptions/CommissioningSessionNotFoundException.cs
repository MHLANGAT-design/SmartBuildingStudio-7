using System;

namespace CommissioningService.Domain.Exceptions;

public class CommissioningSessionNotFoundException : Exception
{
    public Guid SessionId { get; }

    public CommissioningSessionNotFoundException(Guid sessionId)
        : base($"Commissioning session with ID '{sessionId}' was not found.")
    {
        SessionId = sessionId;
    }
}