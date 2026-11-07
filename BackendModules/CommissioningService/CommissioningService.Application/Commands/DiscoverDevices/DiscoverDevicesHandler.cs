using System.Threading;
using System.Threading.Tasks;
using MediatR;
using CommissioningService.Domain.Repositories;
using CommissioningService.Domain.Services;
using CommissioningService.Domain.ValueObjects;
using CommissioningService.Domain.Exceptions;
using CommissioningService.Application.Interfaces;

namespace CommissioningService.Application.Commands.DiscoverDevices;

public class DiscoverDevicesHandler : IRequestHandler<DiscoverDevicesCommand, Unit>
{
    private readonly ICommissioningSessionRepository _repository;
    private readonly CommissioningSessionDomainService _domainService;
    private readonly IDeviceDiscoveryProvider _discoveryProvider;

    public DiscoverDevicesHandler(
        ICommissioningSessionRepository repository,
        CommissioningSessionDomainService domainService,
        IDeviceDiscoveryProvider discoveryProvider)
    {
        _repository = repository;
        _domainService = domainService;
        _discoveryProvider = discoveryProvider;
    }

    public async Task<Unit> Handle(DiscoverDevicesCommand request, CancellationToken cancellationToken)
    {
        var session = await _repository.GetByIdAsync(new CommissioningSessionId(request.SessionId));
        if (session == null) throw new CommissioningSessionNotFoundException(request.SessionId);

        // 1. Get physical devices from the gateway integration
        var discoveredDevices = await _discoveryProvider.DiscoverDevicesAsync(
            request.GatewayId,
            request.LineId,
            cancellationToken);

        // ── NEW ──
        // The DiscoverDevices command is reached from /devices/discover, which
        // the frontend calls as its single discovery action. The domain
        // aggregate requires Idle → Discovering → Addressing, and the
        // Idle → Discovering transition (StartCommissioningSessionCommand)
        // has no HTTP route. Perform it here so this handler is
        // self-sufficient: Idle sessions auto-transition before
        // RegisterDevice/CompleteDiscovery enforce their guards.
        if (session.Status.Value == CommissioningStatus.StatusValue.Idle)
        {
            _domainService.StartDiscovery(session);
        }
        // ── END NEW ──

        // 2. Register them in the domain aggregate
        foreach (var externalId in discoveredDevices)
        {
            _domainService.RegisterDevice(session, externalId);
        }

        _domainService.CompleteDiscovery(session);

        await _repository.UpdateAsync(session);
        return Unit.Value;
    }
}