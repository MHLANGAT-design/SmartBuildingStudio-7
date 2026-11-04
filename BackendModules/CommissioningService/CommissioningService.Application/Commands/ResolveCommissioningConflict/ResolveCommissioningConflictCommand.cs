using System;
using MediatR;

namespace CommissioningService.Application.Commands.ResolveCommissioningConflict;

public record ResolveCommissioningConflictCommand(Guid SessionId, string ConflictId, string ResolutionNotes) : IRequest<Unit>;