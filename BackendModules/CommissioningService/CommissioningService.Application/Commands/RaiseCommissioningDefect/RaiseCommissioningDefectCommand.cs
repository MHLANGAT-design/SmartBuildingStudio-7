using System;
using MediatR;

namespace CommissioningService.Application.Commands.RaiseCommissioningDefect;

public record RaiseCommissioningDefectCommand(Guid SessionId, string TargetId, string Category, string Description, string Severity) : IRequest<Unit>;