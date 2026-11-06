// GatewayManagementService.Application/Queries/GetGateway/GetGatewayHandler.cs

using GatewayManagementService.Application.DTOs;
using GatewayManagementService.Application.Mapping;
using GatewayManagementService.Domain.Repositories;
using GatewayManagementService.Domain.ValueObjects;
using MediatR;

namespace GatewayManagementService.Application.Queries.GetGateway;

public sealed class GetGatewayHandler : IRequestHandler<GetGatewayQuery, GatewayDto?>
{
    private readonly IGatewayRepository _repository;

    public GetGatewayHandler(IGatewayRepository repository)
    {
        _repository = repository;
    }

    public async Task<GatewayDto?> Handle(GetGatewayQuery request, CancellationToken cancellationToken)
    {
        var gateway = await _repository.GetByIdAsync(new GatewayId(request.GatewayId), cancellationToken);
        return gateway?.ToDto();
    }
}