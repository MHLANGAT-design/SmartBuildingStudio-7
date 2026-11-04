using System;
using MediatR;

namespace CommissioningService.Application.Commands.SynchronizeDevices;

public record SynchronizeDevicesCommand(Guid SessionId, string GatewayId, string LineId) : IRequest<Unit>;