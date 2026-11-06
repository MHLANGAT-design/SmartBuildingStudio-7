// GatewayManagementService.Application/Commands/DisconnectGateway/DisconnectGatewayHandler.cs

using GatewayManagementService.Application.DTOs;
using GatewayManagementService.Application.Interfaces;
using GatewayManagementService.Application.Mapping;
using GatewayManagementService.Domain.Repositories;
using GatewayManagementService.Domain.Services;
using GatewayManagementService.Domain.ValueObjects;
using MediatR;

namespace GatewayManagementService.Application.Commands.DisconnectGateway;

public sealed class DisconnectGatewayHandler : IRequestHandler<DisconnectGatewayCommand, GatewayDto>
{
    private readonly GatewayConnectionDomainService _connectionService;
    private readonly IGatewayProgressPublisher _publisher;

    public DisconnectGatewayHandler(
        GatewayConnectionDomainService connectionService,
        IGatewayProgressPublisher publisher)
    {
        _connectionService = connectionService;
        _publisher = publisher;
    }

    public async Task<GatewayDto> Handle(DisconnectGatewayCommand request, CancellationToken cancellationToken)
    {
        var id = new GatewayId(request.GatewayId);
        var gateway = await _connectionService.DisconnectAsync(id, request.Reason, cancellationToken);

        await _publisher.PublishStatusAsync(request.GatewayId, gateway.ConnectionStatus.Value.ToString(), cancellationToken);
        return gateway.ToDto();
    }
}