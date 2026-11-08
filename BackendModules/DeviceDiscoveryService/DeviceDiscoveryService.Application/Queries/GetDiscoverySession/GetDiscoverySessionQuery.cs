// Queries/GetDiscoverySession/GetDiscoverySessionQuery.cs

using DeviceDiscoveryService.Application.DTOs;
using MediatR;

namespace DeviceDiscoveryService.Application.Queries.GetDiscoverySession;

public sealed record GetDiscoverySessionQuery(Guid SessionId)
    : IRequest<DiscoverySessionDto?>;