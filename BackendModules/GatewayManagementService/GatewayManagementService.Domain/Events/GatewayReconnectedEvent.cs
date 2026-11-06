using System;
using GatewayManagementService.Domain.Common;

namespace GatewayManagementService.Domain.Events;

public sealed class GatewayReconnectedEvent : DomainEvent
{
    public Guid GatewayId { get; }

    public GatewayReconnectedEvent(Guid gatewayId)
    {
        GatewayId = gatewayId;
    }
}