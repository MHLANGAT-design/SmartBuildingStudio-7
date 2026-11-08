// Queries/GetDiscoveryHistory/GetDiscoveryHistoryHandler.cs

using DeviceDiscoveryService.Application.DTOs;
using DeviceDiscoveryService.Domain.Repositories;
using DeviceDiscoveryService.Domain.ValueObjects;
using MediatR;

namespace DeviceDiscoveryService.Application.Queries.GetDiscoveryHistory;

public sealed class GetDiscoveryHistoryHandler
    : IRequestHandler<GetDiscoveryHistoryQuery, IReadOnlyList<DiscoveryHistoryDto>>
{
    private readonly IDiscoverySessionRepository _repository;

    public GetDiscoveryHistoryHandler(IDiscoverySessionRepository repository)
    {
        _repository = repository;
    }

    public async Task<IReadOnlyList<DiscoveryHistoryDto>> Handle(
        GetDiscoveryHistoryQuery request,
        CancellationToken cancellationToken)
    {
        var session = await _repository.GetByIdAsync(
            new DiscoverySessionId(request.SessionId), cancellationToken);

        if (session is null) return Array.Empty<DiscoveryHistoryDto>();

        return session.History
            .OrderBy(h => h.OccurredAt)
            .Select(h => new DiscoveryHistoryDto
            {
                Id = h.Id,
                EventType = h.EventType,
                Details = h.Details,
                OccurredAt = h.OccurredAt,
            })
            .ToList();
    }
}