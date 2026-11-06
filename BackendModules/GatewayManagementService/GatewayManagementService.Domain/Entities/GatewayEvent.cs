using System;
using GatewayManagementService.Domain.Common;
using GatewayManagementService.Domain.Enums;

namespace GatewayManagementService.Domain.Entities;

public sealed class GatewayEvent : Entity<Guid>
{
    public GatewayEventType EventType { get; private set; }
    public string? Message { get; private set; }
    public string? Payload { get; private set; }
    public DateTime OccurredAt { get; private set; }

    private GatewayEvent() { }

    public GatewayEvent(GatewayEventType eventType, string? message, string? payload)
    {
        Id = Guid.NewGuid();
        EventType = eventType;
        Message = message;
        Payload = payload;
        OccurredAt = DateTime.UtcNow;
    }
}