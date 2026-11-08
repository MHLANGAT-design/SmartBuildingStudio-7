// Commands/CancelDiscovery/CancelDiscoveryHandler.cs

using DeviceDiscoveryService.Application.Interfaces;
using DeviceDiscoveryService.Domain.Exceptions;
using DeviceDiscoveryService.Domain.Repositories;
using DeviceDiscoveryService.Domain.ValueObjects;
using MediatR;

namespace DeviceDiscoveryService.Application.Commands.CancelDiscovery;

public sealed class CancelDiscoveryHandler : IRequestHandler<CancelDiscoveryCommand, Unit>
{
    private readonly IDiscoverySessionRepository _repository;
    private readonly IDateTimeProvider _clock;

    public CancelDiscoveryHandler(
        IDiscoverySessionRepository repository,
        IDateTimeProvider clock)
    {
        _repository = repository;
        _clock = clock;
    }

    public async Task<Unit> Handle(CancelDiscoveryCommand request, CancellationToken cancellationToken)
    {
        var session = await _repository.GetByIdAsync(
                          new DiscoverySessionId(request.SessionId), cancellationToken)
                      ?? throw new DiscoverySessionNotFoundException(request.SessionId);

        session.CancelDiscovery(_clock.UtcNow);
        await _repository.UpdateAsync(session, cancellationToken);
        return Unit.Value;
    }
}