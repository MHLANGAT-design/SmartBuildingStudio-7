using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using CommissioningService.Domain.Repositories;
using CommissioningService.Domain.ValueObjects;
using CommissioningService.Domain.Exceptions;
using CommissioningService.Application.Interfaces;

namespace CommissioningService.Application.Commands.ReprogramDeviceAddress;

public class ReprogramDeviceAddressHandler : IRequestHandler<ReprogramDeviceAddressCommand, Unit>
{
    private readonly ICommissioningSessionRepository _repository;
    private readonly IAddressingProvider _addressingProvider;

    public ReprogramDeviceAddressHandler(
        ICommissioningSessionRepository repository,
        IAddressingProvider addressingProvider)
    {
        _repository = repository;
        _addressingProvider = addressingProvider;
    }

    public async Task<Unit> Handle(ReprogramDeviceAddressCommand request, CancellationToken cancellationToken)
    {
        var session = await _repository.GetByIdAsync(new CommissioningSessionId(request.SessionId))
            ?? throw new CommissioningSessionNotFoundException(request.SessionId);

        // 1. Write to the physical gateway
        var success = await _addressingProvider.AssignAddressAsync(
            "gw-mock-001",
            "line-default",
            request.DeviceExternalId,
            request.Address,
            cancellationToken);

        if (!success)
            throw new CommissioningSessionInvalidStateException(
                $"Gateway refused to program address {request.Address} to device {request.DeviceExternalId}.");

        // 2. Bypass state machine (used by programming module)
        var device = session.Devices.FirstOrDefault(d => d.ExternalId == request.DeviceExternalId)
            ?? throw new CommissioningDeviceNotFoundException(request.DeviceExternalId);

        session.ForceAssignDeviceAddress(device.Id, new DeviceAddress(request.Address));

        // 3. Persist
        await _repository.UpdateAsync(session);
        return Unit.Value;
    }
}