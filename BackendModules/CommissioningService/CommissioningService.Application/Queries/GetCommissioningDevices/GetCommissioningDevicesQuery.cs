using System;
using System.Collections.Generic;
using MediatR;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Application.Queries.GetCommissioningDevices;

public record GetCommissioningDevicesQuery(Guid SessionId) : IRequest<List<DeviceStateDto>>;