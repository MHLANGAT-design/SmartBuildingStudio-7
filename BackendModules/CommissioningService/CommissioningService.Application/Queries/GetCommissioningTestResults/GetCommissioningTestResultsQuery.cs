using System;
using System.Collections.Generic;
using MediatR;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Application.Queries.GetCommissioningTestResults;

public record GetCommissioningTestResultsQuery(Guid SessionId) : IRequest<List<TestResultDto>>;