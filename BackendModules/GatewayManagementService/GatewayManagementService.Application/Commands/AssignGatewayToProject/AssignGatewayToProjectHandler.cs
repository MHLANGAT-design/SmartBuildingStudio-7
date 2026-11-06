// GatewayManagementService.Application/Commands/AssignGatewayToProject/AssignGatewayToProjectHandler.cs

using GatewayManagementService.Application.DTOs;
using GatewayManagementService.Application.Exceptions;
using GatewayManagementService.Application.Mapping;
using GatewayManagementService.Domain.Repositories;
using GatewayManagementService.Domain.ValueObjects;
using MediatR;

namespace GatewayManagementService.Application.Commands.AssignGatewayToProject;

public sealed class AssignGatewayToProjectHandler : IRequestHandler<AssignGatewayToProjectCommand, GatewayAssignmentDto>
{
    private readonly IGatewayRepository _repository;

    public AssignGatewayToProjectHandler(IGatewayRepository repository)
    {
        _repository = repository;
    }

    public async Task<GatewayAssignmentDto> Handle(AssignGatewayToProjectCommand request, CancellationToken cancellationToken)
    {
        var gateway = await _repository.GetByIdAsync(new GatewayId(request.GatewayId), cancellationToken)
            ?? throw new GatewayApplicationException($"Gateway '{request.GatewayId}' not found.");

        var assignment = gateway.AssignToProject(request.ProjectId, request.FloorId, request.DaliNetworkId);
        await _repository.UpdateAsync(gateway, cancellationToken);
        return assignment.ToDto(request.GatewayId);
    }
}