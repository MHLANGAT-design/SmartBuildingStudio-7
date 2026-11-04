using System.Threading;
using System.Threading.Tasks;
using MediatR;
using CommissioningService.Domain.Repositories;
using CommissioningService.Domain.ValueObjects;
using CommissioningService.Domain.Exceptions;

namespace CommissioningService.Application.Commands.ResolveCommissioningConflict;

public class ResolveCommissioningConflictHandler : IRequestHandler<ResolveCommissioningConflictCommand, Unit>
{
    private readonly ICommissioningSessionRepository _repository;

    public ResolveCommissioningConflictHandler(ICommissioningSessionRepository repository)
    {
        _repository = repository;
    }

    public async Task<Unit> Handle(ResolveCommissioningConflictCommand request, CancellationToken cancellationToken)
    {
        var session = await _repository.GetByIdAsync(new CommissioningSessionId(request.SessionId));
        if (session == null) throw new CommissioningSessionNotFoundException(request.SessionId);

        // Apply conflict resolution to the aggregate
        // session.ResolveConflict(request.ConflictId, request.ResolutionNotes);

        await _repository.UpdateAsync(session);
        return Unit.Value;
    }
}