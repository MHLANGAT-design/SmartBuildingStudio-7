using System;
using MediatR;

namespace CommissioningService.Application.Commands.PauseCommissioningSession;

public record PauseCommissioningSessionCommand(Guid SessionId) : IRequest<Unit>;