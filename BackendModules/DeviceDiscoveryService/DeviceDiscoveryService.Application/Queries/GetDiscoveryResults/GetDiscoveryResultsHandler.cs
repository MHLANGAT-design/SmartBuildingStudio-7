// Queries/GetDiscoveryResults/GetDiscoveryResultsHandler.cs

using DeviceDiscoveryService.Application.DTOs;
using DeviceDiscoveryService.Application.Mapping;
using DeviceDiscoveryService.Domain.Repositories;
using DeviceDiscoveryService.Domain.ValueObjects;
using MediatR;

namespace DeviceDiscoveryService.Application.Queries.GetDiscoveryResults;

public sealed class GetDiscoveryResultsHandler
    : IRequestHandler<GetDiscoveryResultsQuery, DiscoveryResultDto?>
{
    private readonly IDiscoverySessionRepository _repository;

    public GetDiscoveryResultsHandler(IDiscoverySessionRepository repository)
    {
        _repository = repository;
    }

    public async Task<DiscoveryResultDto?> Handle(
        GetDiscoveryResultsQuery request,
        CancellationToken cancellationToken)
    {
        var session = await _repository.GetByIdAsync(
            new DiscoverySessionId(request.SessionId), cancellationToken);

        if (session is null) return null;

        var matches = session.Devices
            .Where(d => d.Match is not null)
            .Select(d => d.Match!.ToDto())
            .ToList();

        var exceptions = session.Devices
            .Where(d => d.Match is not null
                        && (d.Match.Status == MatchStatus.Conflict()
                            || d.Match.Status == MatchStatus.Ambiguous()))
            .Select(d => $"{d.ExternalId}: {d.Match!.Status.Value}")
            .ToList();

        return new DiscoveryResultDto
        {
            SessionId = session.Id.Value,
            TotalDevices = session.DeviceCount,
            MatchedCount = session.Devices.Count(d => d.Match?.Status == MatchStatus.Matched()),
            UnmatchedCount = session.Devices.Count(d => d.Match?.Status == MatchStatus.Unmatched()),
            ConflictCount = session.Devices.Count(d => d.Match?.Status == MatchStatus.Conflict()),
            AmbiguousCount = session.Devices.Count(d => d.Match?.Status == MatchStatus.Ambiguous()),
            Matches = matches,
            Exceptions = exceptions,
        };
    }
}