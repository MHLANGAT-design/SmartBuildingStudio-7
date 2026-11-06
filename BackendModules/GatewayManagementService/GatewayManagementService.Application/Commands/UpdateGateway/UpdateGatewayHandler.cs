// GatewayManagementService.Application/Commands/UpdateGateway/UpdateGatewayHandler.cs

using GatewayManagementService.Application.DTOs;
using GatewayManagementService.Application.Exceptions;
using GatewayManagementService.Application.Mapping;
using GatewayManagementService.Domain.Exceptions;
using GatewayManagementService.Domain.Repositories;
using GatewayManagementService.Domain.ValueObjects;
using MediatR;

namespace GatewayManagementService.Application.Commands.UpdateGateway;

public sealed class UpdateGatewayHandler : IRequestHandler<UpdateGatewayCommand, GatewayDto>
{
    private readonly IGatewayRepository _repository;

    public UpdateGatewayHandler(IGatewayRepository repository)
    {
        _repository = repository;
    }

    public async Task<GatewayDto> Handle(UpdateGatewayCommand request, CancellationToken cancellationToken)
    {
        var id = new GatewayId(request.GatewayId);
        var gateway = await _repository.GetByIdAsync(id, cancellationToken)
            ?? throw new GatewayApplicationException($"Gateway '{request.GatewayId}' not found.");

        gateway.Rename(new GatewayName(request.Name));
        gateway.UpdateEndpoint(new GatewayEndpoint(request.EndpointHost, request.EndpointPort, request.EndpointPath));

        await _repository.UpdateAsync(gateway, cancellationToken);
        return gateway.ToDto();
    }
}