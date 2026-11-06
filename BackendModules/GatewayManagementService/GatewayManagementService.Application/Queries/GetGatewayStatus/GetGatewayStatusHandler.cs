// GatewayManagementService.Application/Queries/GetGatewayStatus/GetGatewayStatusHandler.cs

using GatewayManagementService.Application.DTOs;
using GatewayManagementService.Application.Mapping;
using GatewayManagementService.Domain.Repositories;
using GatewayManagementService.Domain.ValueObjects;
using MediatR;

namespace GatewayManagementService.Application.Queries.GetGatewayStatus;

public sealed class GetGatewayStatusHandler : IRequestHandler<GetGatewayStatusQuery, GatewayStatusDto?>
{
    private readonly IGatewayRepository _repository;

    public GetGatewayStatusHandler(IGatewayRepository repository)
    {
        _repository = repository;
    }

    public async Task<GatewayStatusDto?> Handle(GetGatewayStatusQuery request, CancellationToken cancellationToken)
    {
        var gateway = await _repository.GetByIdAsync(new GatewayId(request.GatewayId), cancellationToken);
        return gateway?.ToStatusDto();
    }
}