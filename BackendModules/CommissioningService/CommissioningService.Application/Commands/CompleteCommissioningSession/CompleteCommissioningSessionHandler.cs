using System.Threading;
using System.Threading.Tasks;
using MediatR;
using CommissioningService.Domain.Repositories;
using CommissioningService.Domain.Services;
using CommissioningService.Domain.ValueObjects;
using CommissioningService.Domain.Exceptions;

namespace CommissioningService.Application.Commands.CompleteCommissioningSession;

public class CompleteCommissioningSessionHandler : IRequestHandler<CompleteCommissioningSessionCommand, Unit>
{
    private readonly ICommissioningSessionRepository _repository;
    private readonly CommissioningCompletionDomainService _completionService;

    public CompleteCommissioningSessionHandler(
        ICommissioningSessionRepository repository,
        CommissioningCompletionDomainService completionService)
    {
        _repository = repository;
        _completionService = completionService;
    }

    public async Task<Unit> Handle(CompleteCommissioningSessionCommand request, CancellationToken cancellationToken)
    {
        var session = await _repository.GetByIdAsync(new CommissioningSessionId(request.SessionId));
        if (session == null) throw new CommissioningSessionNotFoundException(request.SessionId);

        _completionService.CompleteSession(session);
        
        await _repository.UpdateAsync(session);
        return Unit.Value;
    }
}