using System;
using System.Collections.Generic;
using MediatR;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Application.Queries.GetCommissioningNetworkState;

public record GetCommissioningNetworkStateQuery(Guid SessionId) : IRequest<List<NetworkStateDto>>;