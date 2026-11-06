using MediatR;
using System;

namespace GatewayManagementService.Domain.Common;

public abstract class DomainEvent : INotification
{
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
    public bool IsPublished { get; private set; }

    public void MarkAsPublished() => IsPublished = true;
}