using System;
using System.Collections.Generic;
using MediatR;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Application.Queries.GetCommissioningFaults;

public record GetCommissioningFaultsQuery(Guid SessionId) : IRequest<List<FaultDto>>;