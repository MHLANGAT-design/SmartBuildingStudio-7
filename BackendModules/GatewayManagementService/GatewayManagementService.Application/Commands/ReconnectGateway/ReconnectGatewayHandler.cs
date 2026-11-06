// GatewayManagementService.Application/Commands/ReconnectGateway/ReconnectGatewayHandler.cs

using GatewayManagementService.Application.DTOs;
using GatewayManagementService.Application.Exceptions;
using GatewayManagementService.Application.Interfaces;
using GatewayManagementService.Application.Mapping;
using GatewayManagementService.Domain.Exceptions;
using GatewayManagementService.Domain.Repositories;
using GatewayManagementService.Domain.ValueObjects;
using MediatR;

namespace GatewayManagementService.Application.Commands.ReconnectGateway;

public sealed class ReconnectGatewayHandler : IRequestHandler<ReconnectGatewayCommand, GatewayDto>
{
    private readonly IGatewayRepository _repository;
    private readonly IGatewayIntegrationService _integration;
    private readonly IGatewayProgressPublisher _publisher;

    public ReconnectGatewayHandler(
        IGatewayRepository repository,
        IGatewayIntegrationService integration,
        IGatewayProgressPublisher publisher)
    {
        _repository = repository;
        _integration = integration;
        _publisher = publisher;
    }

    public async Task<GatewayDto> Handle(ReconnectGatewayCommand request, CancellationToken cancellationToken)
    {
        var gateway = await _repository.GetByIdAsync(new GatewayId(request.GatewayId), cancellationToken)
            ?? throw new GatewayNotFoundException(request.GatewayId);

        if (gateway.ConnectionStatus == ConnectionStatus.Connected)
        {
            gateway.Disconnect("Forced reconnect.");
        }

        gateway.MarkReconnected();

        var ok = await _integration.PingAsync(request.GatewayId, cancellationToken);
        if (!ok)
        {
            gateway.MarkError("Reconnect failed.");
            await _repository.UpdateAsync(gateway, cancellationToken);
            await _publisher.PublishStatusAsync(request.GatewayId, ConnectionStatus.Error.Value.ToString(), cancellationToken);
            throw new GatewayOperationException($"Reconnect failed for gateway '{request.GatewayId}'.");
        }

        await _repository.UpdateAsync(gateway, cancellationToken);
        await _publisher.PublishStatusAsync(request.GatewayId, gateway.ConnectionStatus.Value.ToString(), cancellationToken);
        return gateway.ToDto();
    }
}