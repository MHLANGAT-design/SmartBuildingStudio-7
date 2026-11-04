using System;
using MediatR;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Application.Queries.GetCommissioningSession;

public record GetCommissioningSessionQuery(Guid SessionId) : IRequest<CommissioningSessionDto>;