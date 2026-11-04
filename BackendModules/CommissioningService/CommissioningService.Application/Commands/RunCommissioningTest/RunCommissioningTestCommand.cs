using System;
using MediatR;

namespace CommissioningService.Application.Commands.RunCommissioningTest;

public record RunCommissioningTestCommand(Guid SessionId, string TestType) : IRequest<Unit>;