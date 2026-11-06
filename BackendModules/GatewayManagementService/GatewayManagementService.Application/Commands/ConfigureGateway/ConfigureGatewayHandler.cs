// GatewayManagementService.Application/Commands/ConfigureGateway/ConfigureGatewayHandler.cs

using GatewayManagementService.Application.DTOs;
using GatewayManagementService.Application.Exceptions;
using GatewayManagementService.Application.Mapping;
using GatewayManagementService.Domain.Repositories;
using GatewayManagementService.Domain.ValueObjects;
using MediatR;

namespace GatewayManagementService.Application.Commands.ConfigureGateway;

public sealed class ConfigureGatewayHandler : IRequestHandler<ConfigureGatewayCommand, GatewayDto>
{
    private readonly IGatewayRepository _repository;

    public ConfigureGatewayHandler(IGatewayRepository repository)
    {
        _repository = repository;
    }

    public async Task<GatewayDto> Handle(ConfigureGatewayCommand request, CancellationToken cancellationToken)
    {
        var gateway = await _repository.GetByIdAsync(new GatewayId(request.GatewayId), cancellationToken)
            ?? throw new GatewayApplicationException($"Gateway '{request.GatewayId}' not found.");

        gateway.UpdateConfiguration(new GatewayConfiguration(
            request.DaliLineCount,
            request.PollingIntervalSeconds,
            request.CommandTimeoutSeconds,
            request.AuthToken));

        await _repository.UpdateAsync(gateway, cancellationToken);
        return gateway.ToDto();
    }
}