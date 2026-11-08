// Queries/GetDiscoveryHistory/GetDiscoveryHistoryQuery.cs

using DeviceDiscoveryService.Application.DTOs;
using MediatR;

namespace DeviceDiscoveryService.Application.Queries.GetDiscoveryHistory;

public sealed record GetDiscoveryHistoryQuery(Guid SessionId)
    : IRequest<IReadOnlyList<DiscoveryHistoryDto>>;