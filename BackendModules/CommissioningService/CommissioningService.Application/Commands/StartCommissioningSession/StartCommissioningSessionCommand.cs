using System;
using MediatR;

namespace CommissioningService.Application.Commands.StartCommissioningSession;

public record StartCommissioningSessionCommand(Guid SessionId) : IRequest<Unit>;