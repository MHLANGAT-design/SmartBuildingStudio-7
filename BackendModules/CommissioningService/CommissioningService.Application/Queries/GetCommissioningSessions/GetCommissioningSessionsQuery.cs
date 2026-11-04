using System;
using System.Collections.Generic;
using MediatR;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Application.Queries.GetCommissioningSessions;

public record GetCommissioningSessionsQuery(Guid ProjectId) : IRequest<List<CommissioningSessionDto>>;