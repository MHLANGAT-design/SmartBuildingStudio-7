using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using CommissioningService.Domain.Repositories;
using CommissioningService.Domain.ValueObjects;
using CommissioningService.Domain.Exceptions;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Application.Queries.GetCommissioningProgress;

public class GetCommissioningProgressHandler : IRequestHandler<GetCommissioningProgressQuery, CommissioningProgressDto>
{
    private readonly ICommissioningSessionRepository _repository;

    public GetCommissioningProgressHandler(ICommissioningSessionRepository repository)
    {
        _repository = repository;
    }

    public async Task<CommissioningProgressDto> Handle(GetCommissioningProgressQuery request, CancellationToken cancellationToken)
    {
        var session = await _repository.GetByIdAsync(new CommissioningSessionId(request.SessionId));
        if (session == null) throw new CommissioningSessionNotFoundException(request.SessionId);

        var totalDevices = session.Devices.Count;
        var addressedDevices = session.Devices.Count(d => d.IsAddressed);
        var testedDevices = session.Tests.Count(t => t.Status == "COMPLETED");
        var openDefects = session.Defects.Count(d => d.Status == "OPEN");

        // Simple progress calculation
        int progressPercent = 0;
        if (totalDevices > 0)
        {
            progressPercent = (int)Math.Round(((double)(addressedDevices + testedDevices) / (totalDevices * 2)) * 100);
        }
        if (session.Status.Value.ToString() == "COMPLETED") progressPercent = 100;

        return new CommissioningProgressDto
        {
            SessionId = session.Id.Value,
            Status = session.Status.Value.ToString().ToUpperInvariant(),
            TotalDevices = totalDevices,
            AddressedDevices = addressedDevices,
            TestedDevices = testedDevices,
            OpenDefects = openDefects,
            ProgressPercentage = progressPercent
        };
    }
}