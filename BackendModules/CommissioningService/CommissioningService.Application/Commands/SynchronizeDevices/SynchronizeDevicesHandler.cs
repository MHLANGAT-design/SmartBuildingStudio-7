using System.Threading;
using System.Threading.Tasks;
using MediatR;
using CommissioningService.Domain.Repositories;
using CommissioningService.Domain.ValueObjects;
using CommissioningService.Domain.Exceptions;

namespace CommissioningService.Application.Commands.SynchronizeDevices;

public class SynchronizeDevicesHandler : IRequestHandler<SynchronizeDevicesCommand, Unit>
{
    private readonly ICommissioningSessionRepository _repository;

    public SynchronizeDevicesHandler(ICommissioningSessionRepository repository)
    {
        _repository = repository;
    }

    public async Task<Unit> Handle(SynchronizeDevicesCommand request, CancellationToken cancellationToken)
    {
        var session = await _repository.GetByIdAsync(new CommissioningSessionId(request.SessionId));
        if (session == null) throw new CommissioningSessionNotFoundException(request.SessionId);

        // Call gateway to sync, update states in aggregate...
        // session.SyncDeviceStates(...);

        await _repository.UpdateAsync(session);
        return Unit.Value;
    }
}