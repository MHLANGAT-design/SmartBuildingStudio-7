using System;
using MediatR;

namespace CommissioningService.Application.Commands.StopCommissioningSession;

public record StopCommissioningSessionCommand(Guid SessionId) : IRequest<Unit>;