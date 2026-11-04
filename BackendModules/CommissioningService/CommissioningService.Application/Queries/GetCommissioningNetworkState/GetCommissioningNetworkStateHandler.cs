using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using CommissioningService.Domain.Repositories;
using CommissioningService.Domain.ValueObjects;
using CommissioningService.Domain.Exceptions;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Application.Queries.GetCommissioningNetworkState;

public class GetCommissioningNetworkStateHandler : IRequestHandler<GetCommissioningNetworkStateQuery, List<NetworkStateDto>>
{
    private readonly ICommissioningSessionRepository _repository;

    public GetCommissioningNetworkStateHandler(ICommissioningSessionRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<NetworkStateDto>> Handle(GetCommissioningNetworkStateQuery request, CancellationToken cancellationToken)
    {
        var session = await _repository.GetByIdAsync(new CommissioningSessionId(request.SessionId));
        if (session == null) throw new CommissioningSessionNotFoundException(request.SessionId);

        return session.NetworkStates.Select(n => new NetworkStateDto
        {
            Id = n.Id,
            LineId = n.LineId,
            GatewayId = n.GatewayId,
            IsConnected = n.IsConnected,
            TotalDevices = n.TotalDevices,
            OnlineDevices = n.OnlineDevices,
            ErrorCount = n.ErrorCount,
            LastScanAt = n.LastScanAt
        }).ToList();
    }
}