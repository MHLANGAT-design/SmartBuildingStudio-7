using System;
using MediatR;

namespace CommissioningService.Application.Commands.DiscoverDevices;

public record DiscoverDevicesCommand(Guid SessionId, string GatewayId, string LineId) : IRequest<Unit>;