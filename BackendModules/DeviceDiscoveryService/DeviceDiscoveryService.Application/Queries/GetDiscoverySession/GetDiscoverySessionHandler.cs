// Queries/GetDiscoverySession/GetDiscoverySessionHandler.cs

using DeviceDiscoveryService.Application.DTOs;
using DeviceDiscoveryService.Application.Mapping;
using DeviceDiscoveryService.Domain.Repositories;
using DeviceDiscoveryService.Domain.ValueObjects;
using MediatR;

namespace DeviceDiscoveryService.Application.Queries.GetDiscoverySession;

public sealed class GetDiscoverySessionHandler
    : IRequestHandler<GetDiscoverySessionQuery, DiscoverySessionDto?>
{
    private readonly IDiscoverySessionRepository _repository;

    public GetDiscoverySessionHandler(IDiscoverySessionRepository repository)
    {
        _repository = repository;
    }

    public async Task<DiscoverySessionDto?> Handle(
        GetDiscoverySessionQuery request,
        CancellationToken cancellationToken)
    {
        var session = await _repository.GetByIdAsync(
            new DiscoverySessionId(request.SessionId), cancellationToken);

        return session?.ToDto();
    }
}