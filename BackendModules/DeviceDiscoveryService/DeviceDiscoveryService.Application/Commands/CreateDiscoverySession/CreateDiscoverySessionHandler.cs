// Commands/CreateDiscoverySession/CreateDiscoverySessionHandler.cs

using DeviceDiscoveryService.Application.DTOs;
using DeviceDiscoveryService.Application.Interfaces;
using DeviceDiscoveryService.Application.Mapping;
using DeviceDiscoveryService.Domain.Repositories;
using MediatR;

namespace DeviceDiscoveryService.Application.Commands.CreateDiscoverySession;

public sealed class CreateDiscoverySessionHandler
    : IRequestHandler<CreateDiscoverySessionCommand, DiscoverySessionDto>
{
    private readonly IDiscoverySessionRepository _repository;
    private readonly IDateTimeProvider _clock;

    public CreateDiscoverySessionHandler(
        IDiscoverySessionRepository repository,
        IDateTimeProvider clock)
    {
        _repository = repository;
        _clock = clock;
    }

    public async Task<DiscoverySessionDto> Handle(
        CreateDiscoverySessionCommand request,
        CancellationToken cancellationToken)
    {
        var scope = new DiscoveryScope(request.GatewayId, request.LineIds);

        var session = DiscoverySession.Create(
            request.ProjectId,
            request.BuildingId,
            request.FloorId,
            request.DrawingDocumentId,
            scope,
            request.StartedBy,
            _clock.UtcNow);

        await _repository.AddAsync(session, cancellationToken);

        return session.ToDto();
    }
}