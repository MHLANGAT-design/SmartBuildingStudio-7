using System;
using MediatR;

namespace CommissioningService.Application.Commands.ReprogramDeviceAddress;

public record ReprogramDeviceAddressCommand(
    Guid SessionId,
    string DeviceExternalId,
    int Address
) : IRequest<Unit>;