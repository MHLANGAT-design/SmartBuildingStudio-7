// GatewayManagementService.Application/Queries/GetGatewayOperations/GetGatewayOperationsHandler.cs

using GatewayManagementService.Application.DTOs;
using GatewayManagementService.Application.Mapping;
using GatewayManagementService.Domain.Repositories;
using GatewayManagementService.Domain.ValueObjects;
using MediatR;

namespace GatewayManagementService.Application.Queries.GetGatewayOperations;

public sealed class GetGatewayOperationsHandler : IRequestHandler<GetGatewayOperationsQuery, IReadOnlyList<GatewayOperationDto>>
{
    private readonly IGatewayRepository _repository;

    public GetGatewayOperationsHandler(IGatewayRepository repository)
    {
        _repository = repository;
    }

    public async Task<IReadOnlyList<GatewayOperationDto>> Handle(GetGatewayOperationsQuery request, CancellationToken cancellationToken)
    {
        var gateway = await _repository.GetByIdAsync(new GatewayId(request.GatewayId), cancellationToken);
        if (gateway == null) return Array.Empty<GatewayOperationDto>();

        return gateway.Operations
            .Select(o => o.ToDto(request.GatewayId))
            .ToList();
    }
}