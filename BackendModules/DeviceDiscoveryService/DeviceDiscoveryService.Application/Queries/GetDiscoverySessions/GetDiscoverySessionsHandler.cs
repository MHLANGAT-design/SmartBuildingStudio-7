// Queries/GetDiscoverySessions/GetDiscoverySessionsHandler.cs

using DeviceDiscoveryService.Application.DTOs;
using DeviceDiscoveryService.Application.Mapping;
using DeviceDiscoveryService.Domain.Repositories;
using MediatR;

namespace DeviceDiscoveryService.Application.Queries.GetDiscoverySessions;

public sealed class GetDiscoverySessionsHandler
    : IRequestHandler<GetDiscoverySessionsQuery, IReadOnlyList<DiscoverySessionDto>>
{
    private readonly IDiscoverySessionRepository _repository;

    public GetDiscoverySessionsHandler(IDiscoverySessionRepository repository)
    {
        _repository = repository;
    }

    public async Task<IReadOnlyList<DiscoverySessionDto>> Handle(
        GetDiscoverySessionsQuery request,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<DiscoverySession> sessions;

        if (request.ProjectId.HasValue && request.FloorId.HasValue)
        {
            sessions = await _repository.GetByFloorAsync(
                request.ProjectId.Value, request.FloorId.Value, cancellationToken);
        }
        else if (request.ProjectId.HasValue)
        {
            sessions = await _repository.GetByProjectAsync(
                request.ProjectId.Value, cancellationToken);
        }
        else
        {
            sessions = await _repository.GetRecentAsync(
                request.Take <= 0 ? 50 : request.Take, cancellationToken);
        }

        return sessions.Select(s => s.ToDto()).ToList();
    }
}