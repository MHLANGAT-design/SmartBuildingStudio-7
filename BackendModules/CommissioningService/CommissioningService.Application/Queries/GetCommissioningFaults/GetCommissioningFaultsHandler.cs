using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using CommissioningService.Domain.Repositories;
using CommissioningService.Domain.ValueObjects;
using CommissioningService.Domain.Exceptions;
using CommissioningService.Application.DTOs;
using CommissioningService.Application.Mapping;

namespace CommissioningService.Application.Queries.GetCommissioningFaults;

public class GetCommissioningFaultsHandler : IRequestHandler<GetCommissioningFaultsQuery, List<FaultDto>>
{
    private readonly ICommissioningSessionRepository _repository;

    public GetCommissioningFaultsHandler(ICommissioningSessionRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<FaultDto>> Handle(GetCommissioningFaultsQuery request, CancellationToken cancellationToken)
    {
        var session = await _repository.GetByIdAsync(new CommissioningSessionId(request.SessionId));
        if (session == null) throw new CommissioningSessionNotFoundException(request.SessionId);

        // In the frontend, Fault = Defect. We map all defects.
        return session.Defects.Select(d => d.ToDto()).ToList();
    }
}