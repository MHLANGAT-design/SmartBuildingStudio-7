using System;

namespace CommissioningService.Domain.Exceptions;

public class CommissioningSessionInvalidStateException : Exception
{
    public CommissioningSessionInvalidStateException(string message) 
        : base(message) 
    { 
    }

    public CommissioningSessionInvalidStateException(string message, Exception innerException) 
        : base(message, innerException) 
    { 
    }
}