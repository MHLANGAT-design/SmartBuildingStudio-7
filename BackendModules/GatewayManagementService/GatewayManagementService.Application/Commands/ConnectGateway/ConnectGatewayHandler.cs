// GatewayManagementService.Application/Commands/ConnectGateway/ConnectGatewayHandler.cs

using GatewayManagementService.Application.DTOs;
using GatewayManagementService.Application.Exceptions;
using GatewayManagementService.Application.Interfaces;
using GatewayManagementService.Application.Mapping;
using GatewayManagementService.Domain.Repositories;
using GatewayManagementService.Domain.Services;
using GatewayManagementService.Domain.ValueObjects;
using MediatR;

namespace GatewayManagementService.Application.Commands.ConnectGateway;

public sealed class ConnectGatewayHandler : IRequestHandler<ConnectGatewayCommand, GatewayDto>
{
    private readonly GatewayConnectionDomainService _connectionService;
    private readonly IGatewayIntegrationService _integration;
    private readonly IGatewayProgressPublisher _publisher;
    private readonly IGatewayRepository _repository;

    public ConnectGatewayHandler(
        GatewayConnectionDomainService connectionService,
        IGatewayIntegrationService integration,
        IGatewayProgressPublisher publisher,
        IGatewayRepository repository)
    {
        _connectionService = connectionService;
        _integration = integration;
        _publisher = publisher;
        _repository = repository;
    }

    public async Task<GatewayDto> Handle(ConnectGatewayCommand request, CancellationToken cancellationToken)
    {
        var id = new GatewayId(request.GatewayId);
        var gateway = await _connectionService.ConnectAsync(id, cancellationToken);

        var ok = await _integration.PingAsync(request.GatewayId, cancellationToken);
        if (!ok)
        {
            gateway.MarkError("Connection failed.");
            await _repository.UpdateAsync(gateway, cancellationToken);
            await _publisher.PublishStatusAsync(request.GatewayId, ConnectionStatus.Error.Value.ToString(), cancellationToken);
            throw new GatewayOperationException($"Gateway '{request.GatewayId}' did not respond to ping.");
        }

        // Use the domain service — it calls MarkConnected() AND persists.
        gateway = await _connectionService.ConfirmConnectedAsync(id, cancellationToken);
        await _publisher.PublishStatusAsync(request.GatewayId, gateway.ConnectionStatus.Value.ToString(), cancellationToken);
        return gateway.ToDto();
    }
}