using System;
using MediatR;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Application.Queries.GetCommissioningReport;

public record GetCommissioningReportQuery(Guid SessionId) : IRequest<CommissioningReportDto>;