using System;
using MediatR;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Application.Queries.GetCommissioningProgress;

public record GetCommissioningProgressQuery(Guid SessionId) : IRequest<CommissioningProgressDto>;