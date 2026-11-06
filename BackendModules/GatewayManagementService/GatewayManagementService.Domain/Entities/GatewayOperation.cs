using System;
using GatewayManagementService.Domain.Common;
using GatewayManagementService.Domain.Enums;

namespace GatewayManagementService.Domain.Entities;

public sealed class GatewayOperation : Entity<Guid>
{
    public GatewayOperationType OperationType { get; private set; }
    public string? Payload { get; private set; }
    public string? Result { get; private set; }
    public bool Succeeded { get; private set; }
    public DateTime StartedAt { get; private set; }
    public DateTime? CompletedAt { get; private set; }
    public string? ErrorMessage { get; private set; }

    private GatewayOperation() { }

    public GatewayOperation(GatewayOperationType operationType, string? payload)
    {
        Id = Guid.NewGuid();
        OperationType = operationType;
        Payload = payload;
        StartedAt = DateTime.UtcNow;
    }

    public void Complete(string result)
    {
        Succeeded = true;
        Result = result;
        CompletedAt = DateTime.UtcNow;
    }

    public void Fail(string errorMessage)
    {
        Succeeded = false;
        ErrorMessage = errorMessage;
        CompletedAt = DateTime.UtcNow;
    }
}