using System;

namespace CommissioningService.Application.Exceptions;

/// <summary>
/// Thrown when an expected application operation (like calling an external integration) fails.
/// </summary>
public class CommissioningOperationException : CommissioningApplicationException
{
    /// <summary>
    /// The name of the operation that failed (e.g., "GatewayCommunication", "SceneExecution").
    /// </summary>
    public string OperationName { get; }

    public CommissioningOperationException(string operationName, string message) 
        : base($"Commissioning operation '{operationName}' failed: {message}")
    {
        OperationName = operationName;
    }

    public CommissioningOperationException(string operationName, string message, Exception innerException) 
        : base($"Commissioning operation '{operationName}' failed: {message}", innerException)
    {
        OperationName = operationName;
    }
}