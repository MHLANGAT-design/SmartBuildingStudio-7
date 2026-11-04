using System;
using System.Collections.Generic;
using MediatR;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Application.Queries.GetCommissioningSceneTests;

public record GetCommissioningSceneTestsQuery(Guid SessionId) : IRequest<List<SceneTestDto>>;