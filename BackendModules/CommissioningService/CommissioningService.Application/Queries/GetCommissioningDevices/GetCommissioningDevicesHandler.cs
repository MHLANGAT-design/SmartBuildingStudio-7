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

namespace CommissioningService.Application.Queries.GetCommissioningDevices;

public class GetCommissioningDevicesHandler : IRequestHandler<GetCommissioningDevicesQuery, List<DeviceStateDto>>
{
    private readonly ICommissioningSessionRepository _repository;

    public GetCommissioningDevicesHandler(ICommissioningSessionRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<DeviceStateDto>> Handle(GetCommissioningDevicesQuery request, CancellationToken cancellationToken)
    {
        var session = await _repository.GetByIdAsync(new CommissioningSessionId(request.SessionId));
        if (session == null) throw new CommissioningSessionNotFoundException(request.SessionId);

        return session.Devices.Select(d => d.ToDto()).ToList();
    }
}