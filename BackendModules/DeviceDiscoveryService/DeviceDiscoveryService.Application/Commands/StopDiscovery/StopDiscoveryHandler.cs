// Commands/StopDiscovery/StopDiscoveryHandler.cs

using DeviceDiscoveryService.Application.Interfaces;
using DeviceDiscoveryService.Domain.Exceptions;
using DeviceDiscoveryService.Domain.Repositories;
using DeviceDiscoveryService.Domain.ValueObjects;
using MediatR;

namespace DeviceDiscoveryService.Application.Commands.StopDiscovery;

public sealed class StopDiscoveryHandler : IRequestHandler<StopDiscoveryCommand, Unit>
{
    private readonly IDiscoverySessionRepository _repository;
    private readonly IDateTimeProvider _clock;

    public StopDiscoveryHandler(
        IDiscoverySessionRepository repository,
        IDateTimeProvider clock)
    {
        _repository = repository;
        _clock = clock;
    }

    public async Task<Unit> Handle(StopDiscoveryCommand request, CancellationToken cancellationToken)
    {
        var session = await _repository.GetByIdAsync(
                          new DiscoverySessionId(request.SessionId), cancellationToken)
                      ?? throw new DiscoverySessionNotFoundException(request.SessionId);

        session.StopDiscovery(_clock.UtcNow);
        await _repository.UpdateAsync(session, cancellationToken);
        return Unit.Value;
    }
}