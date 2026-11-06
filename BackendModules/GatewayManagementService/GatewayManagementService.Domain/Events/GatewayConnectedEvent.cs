using System;
using GatewayManagementService.Domain.Common;

namespace GatewayManagementService.Domain.Events;

public sealed class GatewayConnectedEvent : DomainEvent
{
    public Guid GatewayId { get; }

    public GatewayConnectedEvent(Guid gatewayId)
    {
        GatewayId = gatewayId;
    }
}