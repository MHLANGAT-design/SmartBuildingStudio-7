// Commands/MatchDiscoveredDevices/MatchDiscoveredDevicesHandler.cs

using DeviceDiscoveryService.Application.DTOs;
using DeviceDiscoveryService.Application.Interfaces;
using DeviceDiscoveryService.Application.Mapping;
using DeviceDiscoveryService.Domain.Exceptions;
using DeviceDiscoveryService.Domain.Repositories;
using DeviceDiscoveryService.Domain.Services;
using DeviceDiscoveryService.Domain.ValueObjects;
using MediatR;

namespace DeviceDiscoveryService.Application.Commands.MatchDiscoveredDevices;

public sealed class MatchDiscoveredDevicesHandler
    : IRequestHandler<MatchDiscoveredDevicesCommand, DiscoverySessionDto>
{
    private readonly IDiscoverySessionRepository _repository;
    private readonly IProjectDesignProvider _designProvider;
    private readonly IDeviceMatchingDomainService _matchingService;
    private readonly IDateTimeProvider _clock;

    public MatchDiscoveredDevicesHandler(
        IDiscoverySessionRepository repository,
        IProjectDesignProvider designProvider,
        IDeviceMatchingDomainService matchingService,
        IDateTimeProvider clock)
    {
        _repository = repository;
        _designProvider = designProvider;
        _matchingService = matchingService;
        _clock = clock;
    }

    public async Task<DiscoverySessionDto> Handle(
        MatchDiscoveredDevicesCommand request,
        CancellationToken cancellationToken)
    {
        var session = await _repository.GetByIdAsync(
                          new DiscoverySessionId(request.SessionId), cancellationToken)
                      ?? throw new DiscoverySessionNotFoundException(request.SessionId);

        if (session.Status != DiscoveryStatus.Identifying()
            && session.Status != DiscoveryStatus.Discovering())
            throw new DiscoverySessionInvalidStateException(
                $"Cannot run matching from state {session.Status.Value}.");

        session.BeginMatching(_clock.UtcNow);

        foreach (var lineId in session.Scope.LineIds)
        {
            var designRaw = await _designProvider.GetFixturesForLineAsync(
                session.ProjectId, session.DrawingDocumentId, lineId, cancellationToken);

            var designFixtures = designRaw
                .Select(f => new DesignFixtureSnapshot(
                    f.FixtureId, f.ProductId, f.ProductName, f.DaliGroup,
                    f.ShortAddress, f.X, f.Y))
                .ToList();

            var devicesOnLine = session.Devices
                .Where(d => string.Equals(d.Address.LineId, lineId, StringComparison.OrdinalIgnoreCase))
                .ToList();

            foreach (var device in devicesOnLine)
            {
                var match = _matchingService.MatchSingle(device, designFixtures, _clock.UtcNow);
                session.RegisterMatch(device.Id, match, _clock.UtcNow);
            }
        }

        await _repository.UpdateAsync(session, cancellationToken);
        return session.ToDto();
    }
}