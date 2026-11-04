using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using CommissioningService.Domain.Repositories;
using CommissioningService.Application.DTOs;
using CommissioningService.Application.Mapping;

namespace CommissioningService.Application.Queries.GetCommissioningSessions;

public class GetCommissioningSessionsHandler : IRequestHandler<GetCommissioningSessionsQuery, List<CommissioningSessionDto>>
{
    private readonly ICommissioningSessionRepository _repository;

    public GetCommissioningSessionsHandler(ICommissioningSessionRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<CommissioningSessionDto>> Handle(GetCommissioningSessionsQuery request, CancellationToken cancellationToken)
    {
        // Assuming the repo has a GetByProjectId method
        // var sessions = await _repository.GetByProjectIdAsync(request.ProjectId); 
        
        // Placeholder return
        var sessions = new List<Domain.Aggregates.CommissioningSession>(); 
        
        return sessions.Select(s => s.ToDto()).ToList();
    }
}