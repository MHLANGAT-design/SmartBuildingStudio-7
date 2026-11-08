// Queries/GetDiscoverySessions/GetDiscoverySessionsQuery.cs

using DeviceDiscoveryService.Application.DTOs;
using MediatR;

namespace DeviceDiscoveryService.Application.Queries.GetDiscoverySessions;

public sealed record GetDiscoverySessionsQuery(
    Guid? ProjectId = null,
    Guid? FloorId = null,
    int Take = 50) : IRequest<IReadOnlyList<DiscoverySessionDto>>;