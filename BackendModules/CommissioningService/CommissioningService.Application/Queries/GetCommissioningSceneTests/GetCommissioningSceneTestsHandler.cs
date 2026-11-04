using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using CommissioningService.Domain.Repositories;
using CommissioningService.Domain.ValueObjects;
using CommissioningService.Domain.Exceptions;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Application.Queries.GetCommissioningSceneTests;

public class GetCommissioningSceneTestsHandler : IRequestHandler<GetCommissioningSceneTestsQuery, List<SceneTestDto>>
{
    private readonly ICommissioningSessionRepository _repository;

    public GetCommissioningSceneTestsHandler(ICommissioningSessionRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<SceneTestDto>> Handle(GetCommissioningSceneTestsQuery request, CancellationToken cancellationToken)
    {
        var session = await _repository.GetByIdAsync(new CommissioningSessionId(request.SessionId));
        if (session == null) throw new CommissioningSessionNotFoundException(request.SessionId);

        return session.SceneTests.Select(s => new SceneTestDto
        {
            Id = s.Id,
            SceneId = s.SceneId,
            SceneName = s.SceneName,
            Status = s.Status,
            ExecutedAt = s.ExecutedAt
        }).ToList();
    }
}