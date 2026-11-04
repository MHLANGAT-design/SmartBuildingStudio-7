using System;
using MediatR;

namespace CommissioningService.Application.Commands.DetectCommissioningFaults;

public record DetectCommissioningFaultsCommand(Guid SessionId) : IRequest<Unit>;