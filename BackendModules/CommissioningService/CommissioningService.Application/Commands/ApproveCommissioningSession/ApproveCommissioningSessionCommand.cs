using System;
using MediatR;

namespace CommissioningService.Application.Commands.ApproveCommissioningSession;

public record ApproveCommissioningSessionCommand(Guid SessionId, string ApprovedBy) : IRequest<Unit>;