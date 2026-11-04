using System.Threading;
using System.Threading.Tasks;
using MediatR;
using CommissioningService.Domain.Repositories;
using CommissioningService.Domain.ValueObjects;
using CommissioningService.Domain.Exceptions;
using CommissioningService.Application.Interfaces;

namespace CommissioningService.Application.Commands.RescanDevices;

public class RescanDevicesHandler : IRequestHandler<RescanDevicesCommand, Unit>
{
    private readonly ICommissioningSessionRepository _repository;
    private readonly IDeviceDiscoveryProvider _discoveryProvider;

    public RescanDevicesHandler(
        ICommissioningSessionRepository repository,
        IDeviceDiscoveryProvider discoveryProvider)
    {
        _repository = repository;
        _discoveryProvider = discoveryProvider;
    }

    public async Task<Unit> Handle(RescanDevicesCommand request, CancellationToken cancellationToken)
    {
        var session = await _repository.GetByIdAsync(new CommissioningSessionId(request.SessionId))
            ?? throw new CommissioningSessionNotFoundException(request.SessionId);

        var discovered = await _discoveryProvider.DiscoverDevicesAsync(
            request.GatewayId, request.LineId, cancellationToken);

        // Idempotent update — does NOT advance the session state machine.
        session.RescanDevices(discovered);

        await _repository.UpdateAsync(session);
        return Unit.Value;
    }
}