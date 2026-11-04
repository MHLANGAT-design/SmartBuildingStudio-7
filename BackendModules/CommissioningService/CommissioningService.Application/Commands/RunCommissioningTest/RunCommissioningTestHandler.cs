using System.Threading;
using System.Threading.Tasks;
using MediatR;
using CommissioningService.Domain.Repositories;
using CommissioningService.Domain.ValueObjects;
using CommissioningService.Domain.Exceptions;
using CommissioningService.Application.Interfaces;

namespace CommissioningService.Application.Commands.RunCommissioningTest;

public class RunCommissioningTestHandler : IRequestHandler<RunCommissioningTestCommand, Unit>
{
    private readonly ICommissioningSessionRepository _repository;
    private readonly ICommissioningTestExecutor _testExecutor;

    public RunCommissioningTestHandler(
        ICommissioningSessionRepository repository,
        ICommissioningTestExecutor testExecutor)
    {
        _repository = repository;
        _testExecutor = testExecutor;
    }

    public async Task<Unit> Handle(RunCommissioningTestCommand request, CancellationToken cancellationToken)
    {
        var session = await _repository.GetByIdAsync(new CommissioningSessionId(request.SessionId));
        if (session == null) throw new CommissioningSessionNotFoundException(request.SessionId);

        // Execute physical test, get result, register in aggregate
        // var result = await _testExecutor.ExecuteAsync(...);
        // session.RegisterTest(...);

        await _repository.UpdateAsync(session);
        return Unit.Value;
    }
}