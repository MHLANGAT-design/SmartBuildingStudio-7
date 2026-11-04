using System;

namespace CommissioningService.Application.Exceptions;

/// <summary>
/// Base exception for all errors originating from the Application layer.
/// </summary>
public class CommissioningApplicationException : Exception
{
    public CommissioningApplicationException(string message) 
        : base(message) 
    { 
    }

    public CommissioningApplicationException(string message, Exception innerException) 
        : base(message, innerException) 
    { 
    }
}