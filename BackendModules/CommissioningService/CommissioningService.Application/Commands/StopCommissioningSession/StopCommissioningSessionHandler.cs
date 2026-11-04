using System.Threading;
using System.Threading.Tasks;
using MediatR;
using CommissioningService.Domain.Repositories;
using CommissioningService.Domain.ValueObjects;
using CommissioningService.Domain.Exceptions;

namespace CommissioningService.Application.Commands.StopCommissioningSession;

public class StopCommissioningSessionHandler : IRequestHandler<StopCommissioningSessionCommand, Unit>
{
    private readonly ICommissioningSessionRepository _repository;

    public StopCommissioningSessionHandler(ICommissioningSessionRepository repository)
    {
        _repository = repository;
    }

    public async Task<Unit> Handle(StopCommissioningSessionCommand request, CancellationToken cancellationToken)
    {
        var session = await _repository.GetByIdAsync(new CommissioningSessionId(request.SessionId));
        if (session == null) throw new CommissioningSessionNotFoundException(request.SessionId);

        session.Stop(); // Assuming you add a Stop() method to the aggregate
        
        await _repository.UpdateAsync(session);
        return Unit.Value;
    }
}