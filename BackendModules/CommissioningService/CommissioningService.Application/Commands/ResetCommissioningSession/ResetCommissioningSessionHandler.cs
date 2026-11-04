using System.Threading;
using System.Threading.Tasks;
using MediatR;
using CommissioningService.Domain.Repositories;
using CommissioningService.Domain.ValueObjects;
using CommissioningService.Domain.Exceptions;

namespace CommissioningService.Application.Commands.ResetCommissioningSession;

public class ResetCommissioningSessionHandler : IRequestHandler<ResetCommissioningSessionCommand, Unit>
{
    private readonly ICommissioningSessionRepository _repository;

    public ResetCommissioningSessionHandler(ICommissioningSessionRepository repository)
    {
        _repository = repository;
    }

    public async Task<Unit> Handle(ResetCommissioningSessionCommand request, CancellationToken cancellationToken)
    {
        var session = await _repository.GetByIdAsync(new CommissioningSessionId(request.SessionId));
        if (session == null) throw new CommissioningSessionNotFoundException(request.SessionId);

        session.Reset(); // Assuming you add a Reset() method
        
        await _repository.UpdateAsync(session);
        return Unit.Value;
    }
}