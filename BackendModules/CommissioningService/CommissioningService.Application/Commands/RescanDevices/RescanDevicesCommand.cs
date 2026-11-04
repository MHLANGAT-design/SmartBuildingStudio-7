using System;
using MediatR;

namespace CommissioningService.Application.Commands.RescanDevices;

public record RescanDevicesCommand(Guid SessionId, string GatewayId, string LineId) : IRequest<Unit>;