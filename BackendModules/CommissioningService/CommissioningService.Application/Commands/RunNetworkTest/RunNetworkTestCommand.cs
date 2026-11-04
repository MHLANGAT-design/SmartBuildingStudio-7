using System;
using MediatR;

namespace CommissioningService.Application.Commands.RunNetworkTest;

public record RunNetworkTestCommand(Guid SessionId, string GatewayId, string LineId) : IRequest<Unit>;