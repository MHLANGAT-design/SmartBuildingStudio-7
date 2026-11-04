using System.Threading;
using System.Threading.Tasks;
using MediatR;
using CommissioningService.Domain.Repositories;
using CommissioningService.Domain.Services;
using CommissioningService.Domain.ValueObjects;
using CommissioningService.Domain.Exceptions;

namespace CommissioningService.Application.Commands.RaiseCommissioningDefect;

public class RaiseCommissioningDefectHandler : IRequestHandler<RaiseCommissioningDefectCommand, Unit>
{
    private readonly ICommissioningSessionRepository _repository;
    private readonly CommissioningDefectDomainService _defectService;

    public RaiseCommissioningDefectHandler(
        ICommissioningSessionRepository repository,
        CommissioningDefectDomainService defectService)
    {
        _repository = repository;
        _defectService = defectService;
    }

    public async Task<Unit> Handle(RaiseCommissioningDefectCommand request, CancellationToken cancellationToken)
    {
        var session = await _repository.GetByIdAsync(new CommissioningSessionId(request.SessionId));
        if (session == null) throw new CommissioningSessionNotFoundException(request.SessionId);

        _defectService.RaiseDefect(session, request.TargetId, request.Category, request.Description, request.Severity);
        
        await _repository.UpdateAsync(session);
        return Unit.Value;
    }
}