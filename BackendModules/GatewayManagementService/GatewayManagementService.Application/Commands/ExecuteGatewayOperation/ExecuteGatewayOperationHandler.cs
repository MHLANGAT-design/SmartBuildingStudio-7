using GatewayManagementService.Application.DTOs;
using GatewayManagementService.Application.Exceptions;
using GatewayManagementService.Application.Interfaces;
using GatewayManagementService.Application.Mapping;
using GatewayManagementService.Domain.Enums;
using GatewayManagementService.Domain.Repositories;
using GatewayManagementService.Domain.ValueObjects;
using MediatR;

namespace GatewayManagementService.Application.Commands.ExecuteGatewayOperation;

public sealed class ExecuteGatewayOperationHandler : IRequestHandler<ExecuteGatewayOperationCommand, GatewayOperationDto>
{
    private readonly IGatewayRepository _repository;
    private readonly IGatewayIntegrationService _integration;

    public ExecuteGatewayOperationHandler(
        IGatewayRepository repository,
        IGatewayIntegrationService integration)
    {
        _repository = repository;
        _integration = integration;
    }

    public async Task<GatewayOperationDto> Handle(ExecuteGatewayOperationCommand request, CancellationToken cancellationToken)
    {
        var gateway = await _repository.GetByIdAsync(new GatewayId(request.GatewayId), cancellationToken)
            ?? throw new GatewayApplicationException($"Gateway '{request.GatewayId}' not found.");

        var opType = Enum.Parse<GatewayOperationType>(request.OperationType, ignoreCase: true);
        var op = gateway.RecordOperation(opType, request.Payload);

        try
        {
            var result = await _integration.ExecuteOperationAsync(
                request.GatewayId,
                opType.ToString(),
                request.Payload,
                cancellationToken);
            op.Complete(result);
        }
        catch (Exception ex)
        {
            op.Fail(ex.Message);
        }

        await _repository.UpdateAsync(gateway, cancellationToken);
        return op.ToDto(request.GatewayId);
    }
}