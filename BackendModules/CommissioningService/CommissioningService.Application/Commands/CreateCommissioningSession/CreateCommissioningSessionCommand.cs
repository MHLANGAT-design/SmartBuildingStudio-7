using System;
using MediatR;

namespace CommissioningService.Application.Commands.CreateCommissioningSession;

public record CreateCommissioningSessionCommand(Guid ProjectId, Guid FloorplanId, string StartedBy) : IRequest<Guid>;