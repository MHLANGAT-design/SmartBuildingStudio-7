using GatewayManagementService.Application.DTOs;
using GatewayManagementService.Domain.Entities;

namespace GatewayManagementService.Application.Mapping;

public static class GatewayEventMapping
{
    public static GatewayEventDto ToDto(this GatewayEvent gatewayEvent, Guid gatewayId)
    {
        return new GatewayEventDto
        {
            Id = gatewayEvent.Id,
            GatewayId = gatewayId,
            EventType = gatewayEvent.EventType.ToString(),
            Message = gatewayEvent.Message,
            Payload = gatewayEvent.Payload,
            OccurredAt = gatewayEvent.OccurredAt
        };
    }
}