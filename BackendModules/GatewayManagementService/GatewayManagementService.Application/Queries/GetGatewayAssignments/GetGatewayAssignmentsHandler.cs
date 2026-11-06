// GatewayManagementService.Application/Queries/GetGatewayAssignments/GetGatewayAssignmentsHandler.cs

using GatewayManagementService.Application.DTOs;
using GatewayManagementService.Application.Mapping;
using GatewayManagementService.Domain.Repositories;
using GatewayManagementService.Domain.ValueObjects;
using MediatR;

namespace GatewayManagementService.Application.Queries.GetGatewayAssignments;

public sealed class GetGatewayAssignmentsHandler : IRequestHandler<GetGatewayAssignmentsQuery, IReadOnlyList<GatewayAssignmentDto>>
{
    private readonly IGatewayRepository _repository;

    public GetGatewayAssignmentsHandler(IGatewayRepository repository)
    {
        _repository = repository;
    }

    public async Task<IReadOnlyList<GatewayAssignmentDto>> Handle(GetGatewayAssignmentsQuery request, CancellationToken cancellationToken)
    {
        var gateway = await _repository.GetByIdAsync(new GatewayId(request.GatewayId), cancellationToken);
        if (gateway == null) return Array.Empty<GatewayAssignmentDto>();

        return gateway.Assignments
            .Select(a => a.ToDto(request.GatewayId))
            .ToList();
    }
}