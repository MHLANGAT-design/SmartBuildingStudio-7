// GatewayManagementService.Application/Commands/UnassignGatewayFromProject/UnassignGatewayFromProjectHandler.cs

using GatewayManagementService.Application.Exceptions;
using GatewayManagementService.Domain.Repositories;
using GatewayManagementService.Domain.ValueObjects;
using MediatR;

namespace GatewayManagementService.Application.Commands.UnassignGatewayFromProject;

public sealed class UnassignGatewayFromProjectHandler : IRequestHandler<UnassignGatewayFromProjectCommand, Unit>
{
    private readonly IGatewayRepository _repository;

    public UnassignGatewayFromProjectHandler(IGatewayRepository repository)
    {
        _repository = repository;
    }

    public async Task<Unit> Handle(UnassignGatewayFromProjectCommand request, CancellationToken cancellationToken)
    {
        var gateway = await _repository.GetByIdAsync(new GatewayId(request.GatewayId), cancellationToken)
            ?? throw new GatewayApplicationException($"Gateway '{request.GatewayId}' not found.");

        gateway.UnassignFromProject(request.AssignmentId);
        await _repository.UpdateAsync(gateway, cancellationToken);
        return Unit.Value;
    }
}