using System.Threading;
using System.Threading.Tasks;
using MediatR;
using CommissioningService.Domain.Repositories;
using CommissioningService.Domain.Services;
using CommissioningService.Domain.ValueObjects;
using CommissioningService.Domain.Exceptions;

namespace CommissioningService.Application.Commands.StartCommissioningSession;

public class StartCommissioningSessionHandler : IRequestHandler<StartCommissioningSessionCommand, Unit>
{
    private readonly ICommissioningSessionRepository _repository;
    private readonly CommissioningSessionDomainService _domainService;

    public StartCommissioningSessionHandler(
        ICommissioningSessionRepository repository,
        CommissioningSessionDomainService domainService)
    {
        _repository = repository;
        _domainService = domainService;
    }

    public async Task<Unit> Handle(StartCommissioningSessionCommand request, CancellationToken cancellationToken)
    {
        var session = await _repository.GetByIdAsync(new CommissioningSessionId(request.SessionId));
        if (session == null) throw new CommissioningSessionNotFoundException(request.SessionId);

        _domainService.StartDiscovery(session);
        
        await _repository.UpdateAsync(session);
        return Unit.Value;
    }
}