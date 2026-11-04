using System;
using MediatR;

namespace CommissioningService.Application.Commands.CompleteCommissioningSession;

public record CompleteCommissioningSessionCommand(Guid SessionId) : IRequest<Unit>;