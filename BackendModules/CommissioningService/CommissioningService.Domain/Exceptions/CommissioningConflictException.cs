using System;

namespace CommissioningService.Domain.Exceptions;

public class CommissioningConflictException : Exception
{
    public CommissioningConflictException(string message) 
        : base(message) 
    { 
    }

    public CommissioningConflictException(string message, Exception innerException) 
        : base(message, innerException) 
    { 
    }
}