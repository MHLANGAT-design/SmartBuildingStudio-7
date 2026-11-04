using System;
using MediatR;

namespace CommissioningService.Application.Commands.AssignDeviceAddresses;

public record AssignDeviceAddressesCommand(Guid SessionId, string DeviceExternalId, int Address) : IRequest<Unit>;