// Queries/GetDiscoveryResults/GetDiscoveryResultsQuery.cs

using DeviceDiscoveryService.Application.DTOs;
using MediatR;

namespace DeviceDiscoveryService.Application.Queries.GetDiscoveryResults;

public sealed record GetDiscoveryResultsQuery(Guid SessionId)
    : IRequest<DiscoveryResultDto?>;