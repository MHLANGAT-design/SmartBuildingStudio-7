using System;
using MediatR;

namespace CommissioningService.Application.Commands.ResolveCommissioningDefect;

public record ResolveCommissioningDefectCommand(Guid SessionId, Guid DefectId, string ResolvedBy) : IRequest<Unit>;