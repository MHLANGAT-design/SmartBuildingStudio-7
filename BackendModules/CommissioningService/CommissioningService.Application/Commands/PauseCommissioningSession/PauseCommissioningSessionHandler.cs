using System.Threading;
using System.Threading.Tasks;
using MediatR;
using CommissioningService.Domain.Repositories;
using CommissioningService.Domain.ValueObjects;
using CommissioningService.Domain.Exceptions;

namespace CommissioningService.Application.Commands.PauseCommissioningSession;

public class PauseCommissioningSessionHandler : IRequestHandler<PauseCommissioningSessionCommand, Unit>
{
    private readonly ICommissioningSessionRepository _repository;

    public PauseCommissioningSessionHandler(ICommissioningSessionRepository repository)
    {
        _repository = repository;
    }

    public async Task<Unit> Handle(PauseCommissioningSessionCommand request, CancellationToken cancellationToken)
    {
        var session = await _repository.GetByIdAsync(new CommissioningSessionId(request.SessionId));
        if (session == null) throw new CommissioningSessionNotFoundException(request.SessionId);

        session.Pause(); // Assuming you add a Pause() method
        
        await _repository.UpdateAsync(session);
        return Unit.Value;
    }
}