using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using CommissioningService.Domain.Repositories;
using CommissioningService.Domain.ValueObjects;
using CommissioningService.Application.DTOs;
using CommissioningService.Domain.Exceptions;

namespace CommissioningService.Application.Queries.GetCommissioningSignalLogs;

public class GetCommissioningSignalLogsHandler : IRequestHandler<GetCommissioningSignalLogsQuery, List<SignalLogDto>>
{
    private readonly ICommissioningSessionRepository _repository;

    public GetCommissioningSignalLogsHandler(ICommissioningSessionRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<SignalLogDto>> Handle(GetCommissioningSignalLogsQuery request, CancellationToken cancellationToken)
    {
        var session = await _repository.GetByIdAsync(new CommissioningSessionId(request.SessionId));
        if (session == null) throw new CommissioningSessionNotFoundException(request.SessionId);

        return session.SignalLogs.Select(log => new SignalLogDto
        {
            Id = log.Id,
            DeviceId = log.DeviceId,
            SignalType = log.SignalType,
            Payload = log.Payload,
            LoggedAt = log.LoggedAt
        }).ToList();
    }
}