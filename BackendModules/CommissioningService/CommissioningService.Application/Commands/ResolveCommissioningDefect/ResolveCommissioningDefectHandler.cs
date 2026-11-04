using System.Threading;
using System.Threading.Tasks;
using MediatR;
using CommissioningService.Domain.Repositories;
using CommissioningService.Domain.Services;
using CommissioningService.Domain.ValueObjects;
using CommissioningService.Domain.Exceptions;

namespace CommissioningService.Application.Commands.ResolveCommissioningDefect;

public class ResolveCommissioningDefectHandler : IRequestHandler<ResolveCommissioningDefectCommand, Unit>
{
    private readonly ICommissioningSessionRepository _repository;
    private readonly CommissioningDefectDomainService _defectService;

    public ResolveCommissioningDefectHandler(
        ICommissioningSessionRepository repository,
        CommissioningDefectDomainService defectService)
    {
        _repository = repository;
        _defectService = defectService;
    }

    public async Task<Unit> Handle(ResolveCommissioningDefectCommand request, CancellationToken cancellationToken)
    {
        var session = await _repository.GetByIdAsync(new CommissioningSessionId(request.SessionId));
        if (session == null) throw new CommissioningSessionNotFoundException(request.SessionId);

        _defectService.ResolveDefect(session, request.DefectId, request.ResolvedBy);
        
        await _repository.UpdateAsync(session);
        return Unit.Value;
    }
}