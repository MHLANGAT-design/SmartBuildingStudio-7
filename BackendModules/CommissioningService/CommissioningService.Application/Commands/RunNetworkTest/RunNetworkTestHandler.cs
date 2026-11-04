using System.Threading;
using System.Threading.Tasks;
using MediatR;
using CommissioningService.Domain.Repositories;
using CommissioningService.Domain.ValueObjects;
using CommissioningService.Domain.Exceptions;
using CommissioningService.Application.Interfaces;

namespace CommissioningService.Application.Commands.RunNetworkTest;

public class RunNetworkTestHandler : IRequestHandler<RunNetworkTestCommand, Unit>
{
    private readonly ICommissioningSessionRepository _repository;
    private readonly INetworkTestProvider _networkTestProvider;

    public RunNetworkTestHandler(
        ICommissioningSessionRepository repository,
        INetworkTestProvider networkTestProvider)
    {
        _repository = repository;
        _networkTestProvider = networkTestProvider;
    }

    public async Task<Unit> Handle(RunNetworkTestCommand request, CancellationToken cancellationToken)
    {
        var session = await _repository.GetByIdAsync(new CommissioningSessionId(request.SessionId));
        if (session == null) throw new CommissioningSessionNotFoundException(request.SessionId);

        // var result = await _networkTestProvider.RunNetworkSweepAsync(...);
        // session.RecordNetworkTest(...);

        await _repository.UpdateAsync(session);
        return Unit.Value;
    }
}