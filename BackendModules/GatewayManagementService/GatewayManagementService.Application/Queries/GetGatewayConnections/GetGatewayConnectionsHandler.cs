// GatewayManagementService.Application/Queries/GetGatewayConnections/GetGatewayConnectionsHandler.cs

using GatewayManagementService.Application.DTOs;
using GatewayManagementService.Domain.Repositories;
using GatewayManagementService.Domain.ValueObjects;
using MediatR;

namespace GatewayManagementService.Application.Queries.GetGatewayConnections;

public sealed class GetGatewayConnectionsHandler : IRequestHandler<GetGatewayConnectionsQuery, IReadOnlyList<GatewayConnectionDto>>
{
    private readonly IGatewayRepository _repository;

    public GetGatewayConnectionsHandler(IGatewayRepository repository)
    {
        _repository = repository;
    }

    public async Task<IReadOnlyList<GatewayConnectionDto>> Handle(GetGatewayConnectionsQuery request, CancellationToken cancellationToken)
    {
        var gateway = await _repository.GetByIdAsync(new GatewayId(request.GatewayId), cancellationToken);
        if (gateway == null) return Array.Empty<GatewayConnectionDto>();

        return gateway.ConnectionHistory
            .Select(r => new GatewayConnectionDto
            {
                Id = r.Id,
                ConnectedAt = r.ConnectedAt,
                DisconnectedAt = r.DisconnectedAt,
                DisconnectReason = r.DisconnectReason,
                RemoteEndpoint = r.RemoteEndpoint,
                IsOpen = r.IsOpen
            })
            .ToList();
    }
}