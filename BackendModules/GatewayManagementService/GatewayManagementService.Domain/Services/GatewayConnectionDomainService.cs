using System;
using System.Threading;
using System.Threading.Tasks;
using GatewayManagementService.Domain.Aggregates;
using GatewayManagementService.Domain.Exceptions;
using GatewayManagementService.Domain.Repositories;
using GatewayManagementService.Domain.ValueObjects;

namespace GatewayManagementService.Domain.Services;

public sealed class GatewayConnectionDomainService
{
    private readonly IGatewayRepository _repository;

    public GatewayConnectionDomainService(IGatewayRepository repository)
    {
        _repository = repository;
    }

    public async Task<Gateway> ConnectAsync(GatewayId id, CancellationToken cancellationToken = default)
    {
        var gateway = await _repository.GetByIdAsync(id, cancellationToken)
            ?? throw new GatewayNotFoundException(id.Value);

        gateway.BeginConnect();
        await _repository.UpdateAsync(gateway, cancellationToken);
        return gateway;
    }

    public async Task<Gateway> ConfirmConnectedAsync(GatewayId id, CancellationToken cancellationToken = default)
    {
        var gateway = await _repository.GetByIdAsync(id, cancellationToken)
            ?? throw new GatewayNotFoundException(id.Value);

        gateway.MarkConnected();
        await _repository.UpdateAsync(gateway, cancellationToken);
        return gateway;
    }

    public async Task<Gateway> DisconnectAsync(GatewayId id, string? reason, CancellationToken cancellationToken = default)
    {
        var gateway = await _repository.GetByIdAsync(id, cancellationToken)
            ?? throw new GatewayNotFoundException(id.Value);

        gateway.Disconnect(reason);
        await _repository.UpdateAsync(gateway, cancellationToken);
        return gateway;
    }
}