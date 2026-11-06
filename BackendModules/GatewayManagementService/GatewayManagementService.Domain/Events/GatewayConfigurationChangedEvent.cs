using System;
using GatewayManagementService.Domain.Common;

namespace GatewayManagementService.Domain.Events;

public sealed class GatewayConfigurationChangedEvent : DomainEvent
{
    public Guid GatewayId { get; }

    public GatewayConfigurationChangedEvent(Guid gatewayId)
    {
        GatewayId = gatewayId;
    }
}