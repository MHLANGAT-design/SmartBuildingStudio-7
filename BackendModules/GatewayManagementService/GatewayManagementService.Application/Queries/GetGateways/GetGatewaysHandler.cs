// GatewayManagementService.Application/Queries/GetGateways/GetGatewaysHandler.cs

using GatewayManagementService.Application.DTOs;
using GatewayManagementService.Application.Mapping;
using GatewayManagementService.Domain.Repositories;
using MediatR;

namespace GatewayManagementService.Application.Queries.GetGateways;

public sealed class GetGatewaysHandler : IRequestHandler<GetGatewaysQuery, IReadOnlyList<GatewayDto>>
{
    private readonly IGatewayRepository _repository;

    public GetGatewaysHandler(IGatewayRepository repository)
    {
        _repository = repository;
    }

    public async Task<IReadOnlyList<GatewayDto>> Handle(GetGatewaysQuery request, CancellationToken cancellationToken)
    {
        var gateways = await _repository.GetAllAsync(cancellationToken);
        return gateways.Select(g => g.ToDto()).ToList();
    }
}