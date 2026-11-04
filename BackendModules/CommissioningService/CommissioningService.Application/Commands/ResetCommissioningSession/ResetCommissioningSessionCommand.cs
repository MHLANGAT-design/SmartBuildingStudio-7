using System;
using MediatR;

namespace CommissioningService.Application.Commands.ResetCommissioningSession;

public record ResetCommissioningSessionCommand(Guid SessionId) : IRequest<Unit>;