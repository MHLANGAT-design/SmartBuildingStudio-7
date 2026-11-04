using System;
using System.Collections.Generic;
using MediatR;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Application.Queries.GetCommissioningSignalLogs;

public record GetCommissioningSignalLogsQuery(Guid SessionId) : IRequest<List<SignalLogDto>>;