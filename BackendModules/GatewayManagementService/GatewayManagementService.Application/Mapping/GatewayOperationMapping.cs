using GatewayManagementService.Application.DTOs;
using GatewayManagementService.Domain.Entities;

namespace GatewayManagementService.Application.Mapping;

public static class GatewayOperationMapping
{
    public static GatewayOperationDto ToDto(this GatewayOperation operation, Guid gatewayId)
    {
        return new GatewayOperationDto
        {
            Id = operation.Id,
            GatewayId = gatewayId,
            OperationType = operation.OperationType.ToString(),
            Payload = operation.Payload,
            Result = operation.Result,
            Succeeded = operation.Succeeded,
            StartedAt = operation.StartedAt,
            CompletedAt = operation.CompletedAt,
            ErrorMessage = operation.ErrorMessage
        };
    }
}