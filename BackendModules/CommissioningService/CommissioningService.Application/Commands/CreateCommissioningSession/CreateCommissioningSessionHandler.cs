using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using CommissioningService.Domain.Aggregates;
using CommissioningService.Domain.Repositories;

namespace CommissioningService.Application.Commands.CreateCommissioningSession;

public class CreateCommissioningSessionHandler : IRequestHandler<CreateCommissioningSessionCommand, Guid>
{
    private readonly ICommissioningSessionRepository _repository;

    public CreateCommissioningSessionHandler(ICommissioningSessionRepository repository)
    {
        _repository = repository;
    }

    public async Task<Guid> Handle(CreateCommissioningSessionCommand request, CancellationToken cancellationToken)
    {
        var session = CommissioningSession.Create(request.ProjectId, request.FloorplanId, request.StartedBy);
        
        await _repository.AddAsync(session);
        
        return session.Id.Value;
    }
}