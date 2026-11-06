using System;
using GatewayManagementService.Domain.Common;

namespace GatewayManagementService.Domain.Events;

public sealed class GatewayDisconnectedEvent : DomainEvent
{
    public Guid GatewayId { get; }
    public string? Reason { get; }

    public GatewayDisconnectedEvent(Guid gatewayId, string? reason)
    {
        GatewayId = gatewayId;
        Reason = reason;
    }
}