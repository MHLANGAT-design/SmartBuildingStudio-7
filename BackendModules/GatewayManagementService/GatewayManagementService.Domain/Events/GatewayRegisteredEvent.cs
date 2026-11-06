using System;
using GatewayManagementService.Domain.Common;

namespace GatewayManagementService.Domain.Events;

public sealed class GatewayRegisteredEvent : DomainEvent
{
    public Guid GatewayId { get; }
    public string Name { get; }

    public GatewayRegisteredEvent(Guid gatewayId, string name)
    {
        GatewayId = gatewayId;
        Name = name;
    }
}