using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using CommissioningService.Domain.Entities;
using CommissioningService.Domain.Repositories;
using CommissioningService.Domain.ValueObjects;
using CommissioningService.Domain.Exceptions;
using CommissioningService.Application.Interfaces;

namespace CommissioningService.Application.Commands.RunSceneTest;

public class RunSceneTestHandler : IRequestHandler<RunSceneTestCommand, Unit>
{
    private readonly ICommissioningSessionRepository _repository;
    private readonly ISceneTestProvider _sceneTestProvider;

    public RunSceneTestHandler(
        ICommissioningSessionRepository repository,
        ISceneTestProvider sceneTestProvider)
    {
        _repository = repository;
        _sceneTestProvider = sceneTestProvider;
    }

    public async Task<Unit> Handle(RunSceneTestCommand request, CancellationToken cancellationToken)
    {
        var session = await _repository.GetByIdAsync(new CommissioningSessionId(request.SessionId));
        if (session == null) throw new CommissioningSessionNotFoundException(request.SessionId);

        // 1. Get DTOs from the infrastructure provider
        var dtos = await _sceneTestProvider.RunScenesAsync("gw-mock-001", request.SceneIds, cancellationToken);

        // 2. Map DTOs to Domain Entities
        var domainResults = dtos.Select(dto => 
            new SceneTest(dto.SceneId, dto.SceneName, dto.Status)
        ).ToList();

        // 3. Add to the aggregate
        session.RecordSceneTests(domainResults);

        // 4. Save
        await _repository.UpdateAsync(session);
        return Unit.Value;
    }
}