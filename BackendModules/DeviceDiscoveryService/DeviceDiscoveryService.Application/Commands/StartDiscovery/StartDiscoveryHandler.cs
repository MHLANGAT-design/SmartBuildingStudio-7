// Commands/StartDiscovery/StartDiscoveryHandler.cs

using DeviceDiscoveryService.Application.DTOs;
using DeviceDiscoveryService.Application.Interfaces;
using DeviceDiscoveryService.Application.Mapping;
using DeviceDiscoveryService.Domain.Entities;
using DeviceDiscoveryService.Domain.Exceptions;
using DeviceDiscoveryService.Domain.Repositories;
using DeviceDiscoveryService.Domain.Services;
using DeviceDiscoveryService.Domain.ValueObjects;
using MediatR;

namespace DeviceDiscoveryService.Application.Commands.StartDiscovery;

public sealed class StartDiscoveryHandler
    : IRequestHandler<StartDiscoveryCommand, DiscoverySessionDto>
{
    private readonly IDiscoverySessionRepository _repository;
    private readonly IGatewayDiscoveryProvider _gatewayProvider;
    private readonly IProjectDesignProvider _designProvider;
    private readonly IDeviceIdentificationDomainService _identificationService;
    private readonly IDeviceMatchingDomainService _matchingService;
    private readonly IDateTimeProvider _clock;

    public StartDiscoveryHandler(
        IDiscoverySessionRepository repository,
        IGatewayDiscoveryProvider gatewayProvider,
        IProjectDesignProvider designProvider,
        IDeviceIdentificationDomainService identificationService,
        IDeviceMatchingDomainService matchingService,
        IDateTimeProvider clock)
    {
        _repository = repository;
        _gatewayProvider = gatewayProvider;
        _designProvider = designProvider;
        _identificationService = identificationService;
        _matchingService = matchingService;
        _clock = clock;
    }

    public async Task<DiscoverySessionDto> Handle(
        StartDiscoveryCommand request,
        CancellationToken cancellationToken)
    {
        var sessionId = new DiscoverySessionId(request.SessionId);
        var session = await _repository.GetByIdAsync(sessionId, cancellationToken)
                      ?? throw new DiscoverySessionNotFoundException(request.SessionId);

        try
        {
            // 1. Idle → Discovering
            session.StartDiscovery(_clock.UtcNow);

            // 2. Ask GatewayManagement to scan each line
            var raw = new List<RawDiscoveredDevice>();
            foreach (var lineId in session.Scope.LineIds)
            {
                var lineDevices = await _gatewayProvider.ScanLineAsync(
                    session.Scope.GatewayId, lineId, cancellationToken);
                raw.AddRange(lineDevices);
            }

            // 3. Register each device
            foreach (var r in raw)
            {
                var address = new PhysicalDeviceAddress(r.LineId, r.ShortAddress);
                var device = DiscoveredDevice.Create(
                    r.ExternalId, address, _clock.UtcNow, r.IsOnline);
                session.RegisterDevice(device, _clock.UtcNow);
            }

            // 4. Identify each device (in this pass, the gateway gave us raw
            //    fields already; in real hardware it would be a separate step)
            session.BeginIdentification(_clock.UtcNow);
            foreach (var device in session.Devices)
            {
                var ident = _identificationService.BuildIdentification(
                    gtin: null,
                    manufacturer: null,
                    model: null,
                    firmwareVersion: null,
                    serialNumber: null,
                    deviceType: "DALI",
                    identifiedAt: _clock.UtcNow);
                session.RegisterIdentification(device.Id, ident, _clock.UtcNow);
            }

            // 5. Ask ProjectExplorer for the intended design, per line
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
                    var match = _matchingService.MatchSingle(
                        device, designFixtures, _clock.UtcNow);
                    session.RegisterMatch(device.Id, match, _clock.UtcNow);
                }
            }

            // 6. Complete
            session.CompleteDiscovery(_clock.UtcNow);
        }
        catch (DiscoverySessionInvalidStateException)
        {
            throw;
        }
        catch (Exception ex)
        {
            session.FailDiscovery(ex.Message, _clock.UtcNow);
            await _repository.UpdateAsync(session, cancellationToken);
            throw;
        }

        await _repository.UpdateAsync(session, cancellationToken);
        return session.ToDto();
    }
}